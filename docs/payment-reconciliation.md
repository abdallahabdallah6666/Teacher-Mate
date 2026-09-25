# Payment fulfillment reconciliation runbook

Use this runbook when the payment status page says **payment received; contact support**, or a PostgreSQL order row has `checkoutStatus: "unknown"`, `fulfillmentStatus: "license_creation_unknown"`, or `fulfillmentStatus: "email_delivery_unknown"`. LicenseSeat does not document an idempotency key or authoritative lookup-by-order endpoint for create-license, so retrying an ambiguous create request may create a second license.

## Locate and verify the order

Use the `orderId` shown to the customer. In Google AI Studio/Cloud SQL, inspect `teacher_mate_payment_orders` for that order ID. The JSONB `order_data` contains personal data and a license key after issuance; restrict SQL/Cloud SQL Studio access to authorized operators. The app does not store the raw Chargily webhook payload. Never copy keys, customer emails, provider secrets, or database passwords into support tickets or logs.

Before recovery, verify `status = 'paid'` and compare `checkoutId`, `planId`, `amount`, and `userEmail` against the paid checkout in Chargily. The app verifies the webhook signature before recording the paid state; do not accept a screenshot or browser redirect as proof. If the order is not paid, do not issue a license.

## LicenseSeat create outcome unknown

Search the LicenseSeat product's license list for metadata `order_id` equal to the PostgreSQL order ID.

- **Exactly one matching license:** do not call create again. Confirm plan/customer match the paid order and provide the evidence to the engineering owner. The current app has no operator fulfillment/recovery console; do not edit `order_data` directly. The owner must use a reviewed repair procedure to record the existing LicenseSeat result and resume email delivery.
- **No matching license:** check LicenseSeat activity records and contact LicenseSeat support if unclear. Absence in a listing may not prove the original request failed. Do not issue a second license unless the provider or a qualified operator establishes that the create did not succeed. The app has no supported event replay or reset tool; escalate to the engineering owner rather than manually editing PostgreSQL or using the public checkout endpoint.
- **Multiple matching licenses or a mismatch:** do not email a key. Escalate to the engineering owner and LicenseSeat support to identify the correct license and revoke duplicates if appropriate.

## Resend outcome unknown

Search Resend activity/logs using idempotency key `teacher-mate-license-<orderId>` and the recipient. If Resend accepted the message, do not send it again; give the provider message ID/evidence to the engineering owner for a reviewed repair. If Resend confirms no message was accepted, the owner must use an approved recovery procedure to resume delivery. The app retries ambiguous sends only within a conservative 23-hour window using the same key; after that, verify activity before any resend. Do not manually edit the PostgreSQL workflow state or force a retry through the public API.

## Chargily checkout outcome unknown

Search Chargily using the checkout ID if recorded and order metadata (`orderId`) where available. Confirm whether the checkout exists and whether it is unpaid, paid or failed. A later signed `checkout.paid` event can reconcile an order whose checkout-create response timed out. Do not create another checkout for the same ambiguous intent. If the customer was charged but no matching PostgreSQL order/webhook can be found, escalate to the payment operator and Chargily support; keep the original order reference.

## Limits and change controls

PostgreSQL order/event records and transactional leases survive restarts and coordinate app instances, but no single atomic transaction spans PostgreSQL, Chargily, LicenseSeat and Resend. Provider dashboards are necessary for ambiguous external responses. The app currently has no admin repair console. Until one exists, all manual repair must be performed by the engineering owner using a reviewed, restricted procedure. Do not expose an endpoint that lets a browser mark orders paid, reset workflow state or replay provider calls. Record operator, timestamp, order ID, provider evidence and action in the incident record; never record a license key.

## Official references

- [Google AI Studio and Cloud SQL for PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/ai-assisted-coding-and-cloud-sql)
- [Cloud SQL Node.js Connector](https://github.com/GoogleCloudPlatform/cloud-sql-nodejs-connector)
- [Chargily Pay V2 webhooks](https://dev.chargily.com/pay-v2/webhooks)
- [LicenseSeat API reference](https://licenseseat.com/docs/api-reference/)
- [LicenseSeat create-license guide](https://licenseseat.com/docs/api-reference-create-license/)
- [Resend send-email API and idempotency](https://resend.com/docs/api-reference/emails/send-email)

These instructions are operational guidance; they do not imply provider services were accessed during tests.
