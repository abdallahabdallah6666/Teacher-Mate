# Chargily + LicenseSeat + Resend setup

The payment and fulfillment flow is: create a Chargily Pay V2 checkout; verify Chargily's signed `checkout.paid` event on the server; create a LicenseSeat license using its documented API; send the returned LicenseSeat key to the buyer with Resend; and mark delivery complete. The website's activation-key verifier also calls LicenseSeat, making LicenseSeat the source of truth. The browser return page reports that the email was delivered and does not reveal the license key.

## Required hosting secrets

Set these as **server-side hosting secrets**. Do not put them in frontend code, commit them, or send them in chat.

| Variable | Value |
| --- | --- |
| `CHARGILY_SECRET_KEY` | Chargily V2 `test_sk_…` for sandbox or `live_sk_…` for live. The same key verifies webhook signatures. |
| `LICENSESEAT_SECRET_KEY` | LicenseSeat secret key with both `licenses:create` and `licenses:validate` permissions. |
| `LICENSESEAT_PRODUCT_SLUG` | Product slug from the LicenseSeat dashboard. |
| `LICENSESEAT_PLAN_KEY_SINGLE` | Exact LicenseSeat plan **Key** for the website's `single` plan. |
| `LICENSESEAT_PLAN_KEY_PRO` | Exact LicenseSeat plan **Key** for the website's `pro` plan. |
| `LICENSESEAT_PLAN_KEY_SCHOOL` | Exact LicenseSeat plan **Key** for the website's `school` plan. |
| `RESEND_API_KEY` | Server-side Resend API key. |
| `LICENSE_EMAIL_FROM` | Sender such as `Teacher Mate <licenses@your-verified-domain.example>`. Resend requires a verified sender domain. |
| `APP_URL` | Public HTTPS origin of this website. |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID that owns the Firestore database. This is configuration, not a credential. |

Firestore credentials are not a value to paste into `.env` or chat. On Cloud Run, assign a runtime service identity and grant it `roles/datastore.user` on this project; the Google Cloud client library uses Application Default Credentials. For local development, use ADC for the same project. Do not download or commit a service-account JSON key. Enable billing, create the Firestore **Native mode** `(default)` database in the intended region, and choose that region carefully because it cannot be changed in place. Firestore has usage-based charges; review [current Google Cloud pricing](https://cloud.google.com/firestore/pricing), configure a budget alert and consider scheduled backups before going live. The server SDK uses IAM and bypasses Firestore Security Rules, so restrict project IAM and do not expose payment collections to the browser.

Use the LicenseSeat **plan key**, not its plan display name or plan record UUID. The product, plans, and API key must first exist in the LicenseSeat dashboard. A missing plan key for a product tier prevents creation of a Chargily checkout, so the website should not take payment before fulfillment configuration is complete.

## Chargily setup

The server chooses the API endpoint from the Chargily key prefix: test keys use `https://pay.chargily.net/test/api/v2`; live keys use `https://pay.chargily.net/api/v2`. Configure the Chargily webhook endpoint to:

```text
https://<your-host>/api/webhooks/chargily
```

The code verifies `signature` as HMAC-SHA256 over the raw request body, checks the paid status, DZD amount and checkout metadata, and only then starts fulfillment. Browser redirects are not considered proof of payment.

## LicenseSeat creation and Resend email

For each paid order, the server calls `POST https://licenseseat.com/api/v1/products/{slug}/licenses` with the configured `plan_key` and order metadata. It stores the returned license key and sends it to the checkout email using `POST https://api.resend.com/emails`. Resend uses an order-specific `Idempotency-Key` so repeated payment events do not intentionally send duplicate messages. After creation, `/api/license/verify` validates entered keys with `POST /api/v1/products/{slug}/licenses/validate`.

LicenseSeat's custom create-license API does not send the customer email itself. The configured website email sender (Resend) sends the key returned by LicenseSeat. The API docs explicitly note that creating a license is not idempotent merely because an order ID is stored in metadata.

## Durable order state and recovery behavior

Chargily order records and webhook event claims now live in Firestore, so instance restarts and concurrent app instances share the payment state. Orders are written before checkout creation; signed paid events are validated and claimed transactionally before fulfillment; a lease prevents concurrent processing; fulfillment milestones and the Resend message ID are persisted. The server refuses to start if Firestore is not configured or reachable, and `/api/health` reports storage readiness.

There is an unavoidable distributed-transaction boundary between Firestore and providers. In particular, LicenseSeat's documented create endpoint does not offer an idempotency key or a reliable lookup by order metadata. If a LicenseSeat create request times out or the process stops after LicenseSeat accepts it but before Firestore records its response, the order is marked for **manual reconciliation**; the system does not blindly create a second license. Check LicenseSeat for the order metadata before taking any recovery action. A checkout-create timeout is likewise marked ambiguous, so check Chargily before asking the customer to try again. The browser shows a support message and order reference for these states.

Resend supports idempotency for 24 hours. The app reuses the same order-specific idempotency key and retries an ambiguous email send only within a conservative 23-hour window. If that window has elapsed without a stored success response, it switches to manual reconciliation instead of risking a duplicate email. Completed webhook IDs remain recorded to deduplicate redeliveries. The mock integration test exercises successful fulfillment, duplicate events, uncertain LicenseSeat creation, and safe email retry; it does not call production providers or a live Firestore database.

Before real payments, provision Firestore and hosting identity, add all server-side secrets/configuration, point Chargily's webhook at the deployed HTTPS URL, and verify the test flow with sandbox Chargily, a LicenseSeat test product/plan, and a Resend verified sender. The ambiguous LicenseSeat case still needs an operator runbook/dashboard procedure; do not treat alert-free automation as exactly-once delivery across providers.

## Official documentation

- [Chargily Pay V2 introduction](https://dev.chargily.com/pay-v2/introduction)
- [Chargily create-checkout API](https://dev.chargily.com/pay-v2/api-reference/checkouts/create)
- [Chargily webhook signature verification](https://dev.chargily.com/pay-v2/webhooks)
- [LicenseSeat create-license guide](https://licenseseat.com/docs/api-reference-create-license/)
- [LicenseSeat API quickstart and validation](https://licenseseat.com/docs/api-reference/)
- [LicenseSeat sales and email delivery operations](https://licenseseat.com/docs/guides-sales-platform-operations/)
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction)
- [Firestore IAM roles](https://docs.cloud.google.com/firestore/docs/security/iam)
- [Cloud Run service identity](https://docs.cloud.google.com/run/docs/configuring/services/service-identity)

## Secret incident response

If an API secret has been pasted into chat, committed, or otherwise exposed, revoke/rotate it at the provider and replace the hosting secret. Never reuse a potentially exposed live key.
