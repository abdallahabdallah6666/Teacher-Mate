import assert from 'node:assert/strict';
import http from 'node:http';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'production';
process.env.PORT = '3000';
process.env.CHARGILY_SECRET_KEY = 'test_sk_placeholder_only';
process.env.APP_URL = 'http://localhost:3000';

let chargilyRequest;
globalThis.fetch = async (url, init = {}) => {
  chargilyRequest = { url: String(url), init };
  return {
    ok: true,
    json: async () => ({
      id: 'checkout-test-123',
      status: 'pending',
      checkout_url: 'https://pay.chargily.dz/test/checkouts/checkout-test-123/pay'
    })
  };
};

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
  firstName: 'Test', lastName: 'Teacher', fullName: 'Test Teacher', email: 'chargily-test@example.invalid',
  password: 'not-a-real-password', primaryGrade: '4AP'
});
assert.equal(registration.status, 200);
assert.equal(JSON.parse(registration.body).user.licenseStatus, 'trial', 'signup must not activate before payment');

const checkoutResponse = await request('POST', '/api/checkout/chargily', {
  planId: 'pro', userEmail: 'chargily-test@example.invalid', userName: 'Test Teacher'
});
assert.equal(checkoutResponse.status, 200, checkoutResponse.body);
const checkout = JSON.parse(checkoutResponse.body);
assert.equal(checkout.success, true);
assert.equal(checkout.licenseKey, undefined, 'license key must not be disclosed before signed paid webhook');
assert.equal(chargilyRequest.url, 'https://pay.chargily.net/test/api/v2/checkouts');
assert.equal(chargilyRequest.init.headers.Authorization, 'Bearer test_sk_placeholder_only');
const checkoutPayload = JSON.parse(chargilyRequest.init.body);
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
const duplicateWebhook = await request('POST', '/api/webhooks/chargily', rawEvent, { signature: validSignature });
assert.equal(JSON.parse(duplicateWebhook.body).duplicate, true);

status = await request('GET', `/api/checkout/chargily/status/${checkout.orderId}`);
assert.equal(JSON.parse(status.body).status, 'paid');
assert.equal(JSON.parse(status.body).licenseKey, checkoutPayload.metadata.licenseKey);
const verification = await request('POST', '/api/license/verify', {
  licenseKey: checkoutPayload.metadata.licenseKey,
  userEmail: 'chargily-test@example.invalid'
});
assert.equal(JSON.parse(verification.body).valid, true);

console.log('Chargily flow integration checks passed (mock test API; no external payment request).');
process.exit(0);
