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

## Persistence and operational caveat

This repository currently stores orders, users, licenses and processed webhook IDs in in-memory `Map`/`Set` objects. State is not shared between multiple instances and is lost on a process restart. A crash after LicenseSeat creates a license but before its returned key is recorded can cause duplicate LicenseSeat licenses when Chargily retries; an email accepted by Resend but followed by a lost response is protected by Resend idempotency for 24 hours. **Use a durable shared database and durable webhook/event state before treating this as production-ready for real payments.** Test with Chargily sandbox credentials, a LicenseSeat test product/plan, and Resend's verified sending domain before switching to live mode.

## Official documentation

- [Chargily Pay V2 introduction](https://dev.chargily.com/pay-v2/introduction)
- [Chargily create-checkout API](https://dev.chargily.com/pay-v2/api-reference/checkouts/create)
- [Chargily webhook signature verification](https://dev.chargily.com/pay-v2/webhooks)
- [LicenseSeat create-license guide](https://licenseseat.com/docs/api-reference-create-license/)
- [LicenseSeat API quickstart and validation](https://licenseseat.com/docs/api-reference/)
- [LicenseSeat sales and email delivery operations](https://licenseseat.com/docs/guides-sales-platform-operations/)
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction)

## Secret incident response

If an API secret has been pasted into chat, committed, or otherwise exposed, revoke/rotate it at the provider and replace the hosting secret. Never reuse a potentially exposed live key.
