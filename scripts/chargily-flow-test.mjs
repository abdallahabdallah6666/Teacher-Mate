import assert from 'node:assert/strict';
import http from 'node:http';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.CHARGILY_SECRET_KEY = 'test_sk_placeholder_only';
process.env.APP_URL = 'http://localhost:3000';
process.env.LICENSESEAT_SECRET_KEY = 'sk_placeholder_only';
process.env.LICENSESEAT_PRODUCT_SLUG = 'teacher-mate';
process.env.LICENSESEAT_PLAN_KEY_PRO = 'pro-annual';
process.env.RESEND_API_KEY = 're_placeholder_only';
process.env.LICENSE_EMAIL_FROM = 'Teacher Mate <noreply@example.invalid>';

const externalRequests = [];
const unknownLicenseOrders = new Set();
const resendFailedKeys = new Set();
let checkoutCount = 0;
let failNextCheckout = false;
globalThis.fetch = async (url, init = {}) => {
  const request = { url: String(url), init };
  externalRequests.push(request);
  if (request.url === 'https://pay.chargily.net/test/api/v2/checkouts') {
    if (failNextCheckout) {
      failNextCheckout = false;
      throw new Error('simulated checkout timeout');
    }
    checkoutCount += 1;
    return jsonResponse(201, {
      id: `checkout-test-${checkoutCount}`,
      status: 'pending',
      checkout_url: `https://pay.chargily.dz/test/checkouts/checkout-test-${checkoutCount}/pay`
    });
  }
  if (request.url === 'https://licenseseat.com/api/v1/products/teacher-mate/licenses') {
    const licenseBody = JSON.parse(init.body);
    if (unknownLicenseOrders.has(licenseBody.metadata.order_id)) throw new Error('simulated LicenseSeat timeout');
    return jsonResponse(201, {
      object: 'license',
      license: {
        id: 'license-seat-test-1',
        key: 'LS-TEST-1234-5678',
        plan_key: 'pro-annual',
        expires_at: '2027-09-25T00:00:00Z',
        seat_limit: 3
      }
    });
  }
  if (request.url === 'https://api.resend.com/emails') {
    const key = init.headers['Idempotency-Key'];
    const emailBody = JSON.parse(init.body);
    if (emailBody.to[0] === 'email-retry@example.invalid' && !resendFailedKeys.has(key)) {
      resendFailedKeys.add(key);
      return jsonResponse(500, { name: 'temporary_error' });
    }
    return jsonResponse(200, { id: 'resend-message-test-1' });
  }
  if (request.url === 'https://licenseseat.com/api/v1/products/teacher-mate/licenses/validate') {
    const body = JSON.parse(init.body);
    return jsonResponse(200, {
      object: 'validation_result',
      valid: body.license_key === 'LS-TEST-1234-5678',
      license: { key: body.license_key, plan_key: 'pro-annual', expires_at: '2027-09-25T00:00:00Z' }
    });
  }
  throw new Error(`Unexpected outbound request in mock test: ${request.url}`);
};

function jsonResponse(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

await import('../server.ts');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body)));
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers: {
        ...(payload.length ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
        ...headers
      }
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    if (payload.length) req.write(payload);
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const result = await request('GET', '/api/health');
      if (result.status === 200) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('server did not start');
}

await waitForServer();

const registration = await request('POST', '/api/auth/register', {
  firstName: 'Test', lastName: 'Teacher', fullName: 'Test Teacher', email: 'licenseseat-test@example.invalid',
  password: 'not-a-real-password', primaryGrade: '4AP'
});
assert.equal(registration.status, 200);
assert.equal(JSON.parse(registration.body).user.licenseStatus, 'trial', 'signup must not activate before payment');

const firstOrderId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const firstCheckoutRequest = {
  planId: 'pro', userEmail: 'licenseseat-test@example.invalid', userName: 'Test Teacher', orderId: firstOrderId
};
const checkoutResponse = await request('POST', '/api/checkout/chargily', firstCheckoutRequest);
assert.equal(checkoutResponse.status, 200, checkoutResponse.body);
const checkout = JSON.parse(checkoutResponse.body);
assert.equal(checkout.success, true);
assert.equal(checkout.orderId, firstOrderId);
assert.equal(checkout.licenseKey, undefined, 'license key must not be disclosed before paid event');
assert.equal(externalRequests[0].url, 'https://pay.chargily.net/test/api/v2/checkouts');
const checkoutPayload = JSON.parse(externalRequests[0].init.body);
assert.equal(checkoutPayload.amount, 2900);
assert.equal(checkoutPayload.currency, 'dzd');
assert.match(checkoutPayload.webhook_endpoint, /\/api\/webhooks\/chargily$/);
assert.equal(checkoutPayload.metadata.orderId, checkout.orderId);
const retrySameCheckout = await request('POST', '/api/checkout/chargily', firstCheckoutRequest);
assert.equal(retrySameCheckout.status, 200);
assert.equal(JSON.parse(retrySameCheckout.body).checkoutUrl, checkout.checkoutUrl);
assert.equal(checkoutCount, 1, 'retrying a completed checkout request must not create another Chargily checkout');

let status = await request('GET', `/api/checkout/chargily/status/${checkout.orderId}`);
assert.equal(JSON.parse(status.body).status, 'pending');

const event = {
  id: 'event-test-123', entity: 'event', type: 'checkout.paid',
  data: {
    id: 'checkout-test-1', entity: 'checkout', amount: 2900, currency: 'dzd', status: 'paid',
    metadata: checkoutPayload.metadata
  }
};
const rawEvent = Buffer.from(JSON.stringify(event));
const validSignature = createHmac('sha256', process.env.CHARGILY_SECRET_KEY).update(rawEvent).digest('hex');
const badWebhook = await request('POST', '/api/webhooks/chargily', rawEvent, { signature: '0'.repeat(64) });
assert.equal(badWebhook.status, 403, 'invalid webhook signatures must be rejected');
const validWebhook = await request('POST', '/api/webhooks/chargily', rawEvent, { signature: validSignature });
assert.equal(validWebhook.status, 200, validWebhook.body);
assert.deepEqual(externalRequests.map(item => item.url), [
  'https://pay.chargily.net/test/api/v2/checkouts',
  'https://licenseseat.com/api/v1/products/teacher-mate/licenses',
  'https://api.resend.com/emails'
]);

const licenseRequest = JSON.parse(externalRequests[1].init.body);
assert.equal(licenseRequest.plan_key, 'pro-annual');
assert.equal(licenseRequest.metadata.order_id, checkout.orderId);
assert.equal(licenseRequest.metadata.buyer_email, 'licenseseat-test@example.invalid');
const emailRequest = JSON.parse(externalRequests[2].init.body);
assert.deepEqual(emailRequest.to, ['licenseseat-test@example.invalid']);
assert.equal(emailRequest.from, process.env.LICENSE_EMAIL_FROM);
assert.match(emailRequest.text, /LS-TEST-1234-5678/);
assert.equal(externalRequests[2].init.headers['Idempotency-Key'], `teacher-mate-license-${checkout.orderId}`);

const duplicateWebhook = await request('POST', '/api/webhooks/chargily', rawEvent, { signature: validSignature });
assert.equal(JSON.parse(duplicateWebhook.body).duplicate, true);
assert.equal(externalRequests.length, 3, 'duplicate payment event must not recreate or re-email a license');

status = await request('GET', `/api/checkout/chargily/status/${checkout.orderId}`);
assert.equal(JSON.parse(status.body).status, 'paid');
assert.equal(JSON.parse(status.body).emailSent, true);
assert.equal(JSON.parse(status.body).licenseKey, undefined, 'license key is delivered by email, not exposed by payment status');
const verification = await request('POST', '/api/license/verify', {
  licenseKey: 'LS-TEST-1234-5678',
  userEmail: 'licenseseat-test@example.invalid'
});
assert.equal(JSON.parse(verification.body).valid, true);
assert.equal(JSON.parse(externalRequests[3].init.body).license_key, 'LS-TEST-1234-5678');

const ambiguousCheckoutId = '11111111-1111-4111-8111-111111111111';
failNextCheckout = true;
const timedOutCheckout = await request('POST', '/api/checkout/chargily', {
  planId: 'pro', userEmail: 'checkout-retry@example.invalid', userName: 'Checkout Retry', orderId: ambiguousCheckoutId
});
assert.equal(timedOutCheckout.status, 502);
assert.equal(JSON.parse(timedOutCheckout.body).orderId, ambiguousCheckoutId);
const checkoutCallsAfterTimeout = externalRequests.filter(item => item.url.includes('/checkouts')).length;
const duplicateTimedOutCheckout = await request('POST', '/api/checkout/chargily', {
  planId: 'pro', userEmail: 'checkout-retry@example.invalid', userName: 'Checkout Retry', orderId: ambiguousCheckoutId
});
assert.equal(duplicateTimedOutCheckout.status, 409);
assert.equal(JSON.parse(duplicateTimedOutCheckout.body).needsSupport, true);
assert.equal(externalRequests.filter(item => item.url.includes('/checkouts')).length, checkoutCallsAfterTimeout, 'an ambiguous checkout must not be created again');

const unknownLicenseCheckoutResponse = await request('POST', '/api/checkout/chargily', {
  planId: 'pro', userEmail: 'license-unknown@example.invalid', userName: 'Unknown License'
});
const unknownLicenseCheckout = JSON.parse(unknownLicenseCheckoutResponse.body);
const unknownLicenseCreate = externalRequests.filter(item => item.url.endsWith('/licenses')).length;
unknownLicenseOrders.add(unknownLicenseCheckout.orderId);
const unknownLicensePayload = externalRequests.findLast(item => item.url === 'https://pay.chargily.net/test/api/v2/checkouts');
const unknownLicenseEvent = {
  id: 'event-license-unknown', type: 'checkout.paid',
  data: { id: 'checkout-test-2', amount: 2900, currency: 'dzd', status: 'paid', metadata: JSON.parse(unknownLicensePayload.init.body).metadata }
};
const unknownLicenseRaw = Buffer.from(JSON.stringify(unknownLicenseEvent));
const unknownLicenseSig = createHmac('sha256', process.env.CHARGILY_SECRET_KEY).update(unknownLicenseRaw).digest('hex');
const unknownLicenseWebhook = await request('POST', '/api/webhooks/chargily', unknownLicenseRaw, { signature: unknownLicenseSig });
assert.equal(unknownLicenseWebhook.status, 200);
status = await request('GET', `/api/checkout/chargily/status/${unknownLicenseCheckout.orderId}`);
assert.equal(JSON.parse(status.body).needsSupport, true);
unknownLicenseEvent.id = 'event-license-unknown-redelivery';
const unknownLicenseReplayRaw = Buffer.from(JSON.stringify(unknownLicenseEvent));
const unknownLicenseReplaySig = createHmac('sha256', process.env.CHARGILY_SECRET_KEY).update(unknownLicenseReplayRaw).digest('hex');
await request('POST', '/api/webhooks/chargily', unknownLicenseReplayRaw, { signature: unknownLicenseReplaySig });
assert.equal(externalRequests.filter(item => item.url.endsWith('/licenses')).length, unknownLicenseCreate + 1, 'ambiguous LicenseSeat creation must not be retried blindly');

const retryEmailResponse = await request('POST', '/api/checkout/chargily', {
  planId: 'pro', userEmail: 'email-retry@example.invalid', userName: 'Email Retry'
});
const retryEmailCheckout = JSON.parse(retryEmailResponse.body);
const retryEmailCreate = externalRequests.filter(item => item.url.endsWith('/licenses')).length;
const retryEmailPayload = externalRequests.findLast(item => item.url === 'https://pay.chargily.net/test/api/v2/checkouts');
const retryEmailEvent = {
  id: 'event-email-retry', type: 'checkout.paid',
  data: { id: 'checkout-test-3', amount: 2900, currency: 'dzd', status: 'paid', metadata: JSON.parse(retryEmailPayload.init.body).metadata }
};
const retryEmailRaw = Buffer.from(JSON.stringify(retryEmailEvent));
const retryEmailSig = createHmac('sha256', process.env.CHARGILY_SECRET_KEY).update(retryEmailRaw).digest('hex');
const failedEmailAttempt = await request('POST', '/api/webhooks/chargily', retryEmailRaw, { signature: retryEmailSig });
assert.equal(failedEmailAttempt.status, 503);
const successfulEmailRetry = await request('POST', '/api/webhooks/chargily', retryEmailRaw, { signature: retryEmailSig });
assert.equal(successfulEmailRetry.status, 200);
assert.equal(externalRequests.filter(item => item.url.endsWith('/licenses')).length, retryEmailCreate + 1, 'email retry must not recreate the license');
const retryAttempts = externalRequests.filter(item => item.url === 'https://api.resend.com/emails' && JSON.parse(item.init.body).to[0] === 'email-retry@example.invalid');
assert.equal(retryAttempts.length, 2);
assert.equal(retryAttempts[0].init.headers['Idempotency-Key'], retryAttempts[1].init.headers['Idempotency-Key']);
status = await request('GET', `/api/checkout/chargily/status/${retryEmailCheckout.orderId}`);
assert.equal(JSON.parse(status.body).emailSent, true);

console.log('Mock durable payment flow passed: checkout timeout dedupe, signed paid fulfillment, event dedupe, LicenseSeat manual reconciliation, and safe Resend retry (no provider network calls).');
process.exit(0);
