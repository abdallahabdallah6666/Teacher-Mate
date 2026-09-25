import assert from 'node:assert/strict';
import http from 'node:http';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'production';
process.env.PORT = '3000';
process.env.CHARGILY_SECRET_KEY = 'test_sk_placeholder_only';
process.env.APP_URL = 'http://localhost:3000';
process.env.LICENSESEAT_SECRET_KEY = 'sk_placeholder_only';
process.env.LICENSESEAT_PRODUCT_SLUG = 'teacher-mate';
process.env.LICENSESEAT_PLAN_KEY_PRO = 'pro-annual';
process.env.RESEND_API_KEY = 're_placeholder_only';
process.env.LICENSE_EMAIL_FROM = 'Teacher Mate <noreply@example.invalid>';

const externalRequests = [];
globalThis.fetch = async (url, init = {}) => {
  const request = { url: String(url), init };
  externalRequests.push(request);
  if (request.url === 'https://pay.chargily.net/test/api/v2/checkouts') {
    return jsonResponse(201, {
      id: 'checkout-test-123',
      status: 'pending',
      checkout_url: 'https://pay.chargily.dz/test/checkouts/checkout-test-123/pay'
    });
  }
  if (request.url === 'https://licenseseat.com/api/v1/products/teacher-mate/licenses') {
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

const checkoutResponse = await request('POST', '/api/checkout/chargily', {
  planId: 'pro', userEmail: 'licenseseat-test@example.invalid', userName: 'Test Teacher'
});
assert.equal(checkoutResponse.status, 200, checkoutResponse.body);
const checkout = JSON.parse(checkoutResponse.body);
assert.equal(checkout.success, true);
assert.equal(checkout.licenseKey, undefined, 'license key must not be disclosed before paid event');
assert.equal(externalRequests[0].url, 'https://pay.chargily.net/test/api/v2/checkouts');
const checkoutPayload = JSON.parse(externalRequests[0].init.body);
assert.equal(checkoutPayload.amount, 2900);
assert.equal(checkoutPayload.currency, 'dzd');
assert.match(checkoutPayload.webhook_endpoint, /\/api\/webhooks\/chargily$/);
assert.equal(checkoutPayload.metadata.orderId, checkout.orderId);

let status = await request('GET', `/api/checkout/chargily/status/${checkout.orderId}`);
assert.equal(JSON.parse(status.body).status, 'pending');

const event = {
  id: 'event-test-123', entity: 'event', type: 'checkout.paid',
  data: {
    id: 'checkout-test-123', entity: 'checkout', amount: 2900, currency: 'dzd', status: 'paid',
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

console.log('Mock Chargily → LicenseSeat → Resend flow checks passed (no external payment, license, or email calls).');
process.exit(0);
