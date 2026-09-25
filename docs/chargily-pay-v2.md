# Chargily + LicenseSeat + Resend with PostgreSQL

Payment and fulfillment follow this path: the server creates a Chargily Pay V2 checkout; verifies the signed `checkout.paid` webhook; creates a LicenseSeat license through its documented API; emails the returned key with Resend; and marks the order delivered. LicenseSeat remains the activation-key source of truth. The browser return page never exposes a key.

## Google AI Studio and Cloud SQL setup

Google AI Studio's documented integration can provision Cloud SQL for PostgreSQL and deploy the full-stack application through Cloud Run. In AI Studio Build mode, choose **Enable Cloud SQL** and choose the intended Google Cloud project and region. Google documents that the project/location applies to integrated resources and that the location cannot be changed in place; confirm the account's starter-tier limits or any applicable Cloud SQL billing before enabling. The app's server adapter uses Google's Cloud SQL Node.js Connector and initializes its payment tables at startup.

Configure these connection settings in the AI Studio/Cloud Run server-side environment:

| Variable | Value | Secret? |
| --- | --- | --- |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL instance connection name in `project:region:instance` form. | No |
| `DB_USER` | PostgreSQL database user. | No |
| `DB_NAME` | PostgreSQL database name. | No |
| `DB_PASS` | Password for the database user. | **Yes** |
| `CLOUD_SQL_IP_TYPE` | Optional; `PUBLIC` by default, or `PRIVATE` if private networking is configured. | No |

The Cloud Run service identity needs the Cloud SQL Client role (`roles/cloudsql.client`) and database access. The connector uses Application Default Credentials for the secure instance connection; do not commit or download a service-account JSON key. Store `DB_PASS` as a hosting secret. Cloud SQL charges/quotas depend on the AI Studio project/tier; check the current [Cloud SQL for PostgreSQL pricing and starter-tier limits](https://docs.cloud.google.com/sql/docs/postgres/ai-assisted-coding-and-cloud-sql) before enabling. If AI Studio already created a Cloud SQL database for this app, use that instance's generated connection name, database and user instead of creating another one.

## Required payment and email settings

Set these as **server-side hosting secrets**. Never put provider secret values in frontend code, commit them, or send them in chat.

| Variable | Value |
| --- | --- |
| `CHARGILY_SECRET_KEY` | Chargily V2 `test_sk_…` for sandbox or `live_sk_…` for production. It also verifies webhook signatures. |
| `LICENSESEAT_SECRET_KEY` | LicenseSeat secret key with `licenses:create` and `licenses:validate` permissions. |
| `RESEND_API_KEY` | Resend server-side API key. |

Also configure `LICENSESEAT_PRODUCT_SLUG`, the exact `LICENSESEAT_PLAN_KEY_SINGLE`, `LICENSESEAT_PLAN_KEY_PRO`, and `LICENSESEAT_PLAN_KEY_SCHOOL` values from LicenseSeat, `LICENSE_EMAIL_FROM` on a Resend-verified domain, and the public HTTPS `APP_URL`. Plan keys/product slug are identifiers, not API secrets. Use LicenseSeat plan keys—not display names or record UUIDs. The app refuses checkout creation if any plan's fulfillment configuration is missing.

## Chargily setup

The server selects sandbox or production endpoint based on the Chargily key prefix. Configure the Chargily webhook endpoint as:

```text
https://<your-host>/api/webhooks/chargily
```

The server checks the `signature` HMAC-SHA256 over the raw request body, paid status, DZD amount, checkout ID, metadata and stored order. A browser redirect is not proof of payment. Set `APP_URL` to the deployed public HTTPS origin.

## LicenseSeat and Resend fulfillment

For each verified paid order, the server calls `POST https://licenseseat.com/api/v1/products/{slug}/licenses` with the configured `plan_key` and order metadata. It persists the returned key/ID in PostgreSQL, then sends the key to the buyer with `POST https://api.resend.com/emails`. Resend uses an order-specific idempotency key. `/api/license/verify` checks entered keys against LicenseSeat.

## Durable payment data and recovery

The PostgreSQL adapter stores checkout orders (including fulfillment milestones and the delivered key) in `teacher_mate_payment_orders` and webhook deduplication/leases in `teacher_mate_chargily_events`. It creates these tables with `CREATE TABLE IF NOT EXISTS` at server startup; no Firestore setup, project ID or service-account JSON credential is used. Health readiness probes PostgreSQL, and the service does not start if durable payment storage is unavailable. The payment persistence layer is separate from the website's other existing in-memory user/tutorial/admin data; this change does not migrate those unrelated application stores.

The implementation persists checkout intent before contacting Chargily and uses client-generated stable order IDs so retries reuse an existing checkout or stop for reconciliation instead of opening another. Webhook event/order claims use PostgreSQL transactions and leases to coordinate multiple instances. Fulfillment progress survives process restarts.

There remains an external exactly-once limit: LicenseSeat does not document an idempotency key for create-license or an authoritative order-metadata lookup. If a LicenseSeat create request times out after it may have succeeded, the order stops for reviewed manual reconciliation; the app will not blindly create another license. A checkout-creation timeout is also blocked from duplicate attempts until reconciled; a later valid signed paid webhook can still resolve it. Resend's documented idempotency lifetime is 24 hours, so the app retries ambiguous sends only within a conservative 23-hour window with the same key, then requires manual review. The app currently has no operator repair console; see the [payment reconciliation runbook](payment-reconciliation.md).

Test with Chargily sandbox credentials, a LicenseSeat test product/plan, and a verified Resend sender before switching to live mode. The mocked flow test does not contact Cloud SQL or any live provider.

## Official references

- [Google AI Studio and Cloud SQL for PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/ai-assisted-coding-and-cloud-sql)
- [Google Cloud SQL from Cloud Run](https://docs.cloud.google.com/sql/docs/postgres/connect-run)
- [Cloud SQL Node.js Connector](https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector)
- [node-postgres TLS guidance](https://node-postgres.com/features/ssl)
- [Chargily Pay V2 introduction](https://dev.chargily.com/pay-v2/introduction)
- [Chargily create-checkout API](https://dev.chargily.com/pay-v2/api-reference/checkouts/create)
- [Chargily webhook signature verification](https://dev.chargily.com/pay-v2/webhooks)
- [LicenseSeat create-license guide](https://licenseseat.com/docs/api-reference-create-license/)
- [LicenseSeat API quickstart and validation](https://licenseseat.com/docs/api-reference/)
- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction)

## Secret incident response

If an API secret has been pasted into chat, committed, or otherwise exposed, revoke/rotate it at the provider and replace the hosting secret. Never reuse a potentially exposed live key.
