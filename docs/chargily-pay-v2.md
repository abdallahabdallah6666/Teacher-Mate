# Chargily Pay V2 setup

The application creates hosted Chargily checkouts from the server, redirects customers to the returned `checkout_url`, and activates a license only after processing a valid signed `checkout.paid` webhook. It verifies the `signature` header as an HMAC-SHA256 over the raw request body with the same Chargily API secret used for checkout creation. Duplicate event IDs are ignored while the server process remains alive.

## Credentials and modes

Set `CHARGILY_SECRET_KEY` as a **server-side secret** in the hosting environment. A `test_sk_…` key selects Chargily's test API at `https://pay.chargily.net/test/api/v2`; a `live_sk_…` key selects the live API at `https://pay.chargily.net/api/v2`. Do not put either key in frontend code, a committed `.env` file, or a public repository. This one secret is also used to verify webhook signatures; the current server flow does not require `CHARGILY_APP_KEY`.

Set `APP_URL` to the public HTTPS origin where the application is hosted. The webhook endpoint supplied to Chargily is:

```text
https://<your-host>/api/webhooks/chargily
```

For testing, configure the corresponding test-mode webhook in Chargily and use a `test_sk_…` key. Switch to live mode only after end-to-end verification using Chargily's live dashboard configuration and a persistent production datastore.

## Important persistence requirement

This repository's existing application data layer uses in-memory JavaScript `Map` objects. The Chargily order lookup and webhook event de-duplication currently use the same in-memory pattern. Therefore, checkout status and application-issued license records are **not durable across process restarts and are not shared across multiple server instances**. The webhook's signed metadata can still identify the paid checkout, but the website's return-status lookup and license/account records need a persistent shared database before this can be considered production-ready. Do not accept live payments on a multi-instance or restart-prone deployment until persistence is added.

## Official documentation

- [Chargily Pay V2 introduction](https://dev.chargily.com/pay-v2/introduction)
- [Create a checkout API reference](https://dev.chargily.com/pay-v2/api-reference/checkouts/create)
- [Chargily webhook signature verification](https://dev.chargily.com/pay-v2/webhooks)
- [Full checkout and webhook guide](https://dev.chargily.com/pay-v2/the-full-guide/create-a-checkout)

The handler responds with HTTP 200 only after a syntactically valid, signed event has been processed (or recognized as a duplicate). Invalid/missing signatures are rejected. Payment status comes from the signed webhook, not from the browser redirect.

## Secret incident response

If an API secret has been pasted into chat, committed, or otherwise exposed, revoke/rotate it in Chargily before production use and replace the hosting secret. Never reuse a potentially exposed live key for validation.
