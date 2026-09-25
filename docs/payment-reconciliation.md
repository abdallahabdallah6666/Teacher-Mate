# Payment fulfillment reconciliation runbook

This runbook applies when the payment status page shows **payment received; contact support**, or a Firestore order has `checkoutStatus: "unknown"`, `fulfillmentStatus: "license_creation_unknown"`, or `fulfillmentStatus: "email_delivery_unknown"`. It is intentionally manual: LicenseSeat does not document a create-license idempotency key or an authoritative lookup-by-order endpoint, so retrying an ambiguous create request may create a second license.

## Locate and verify the order

Use the `orderId` shown to the customer. In Google Cloud Console, open the Firestore Native-mode database for `GOOGLE_CLOUD_PROJECT`, then collection `teacherMatePaymentOrders`, document ID equal to that order ID. Do not copy license keys, customer emails, or provider secrets into support tickets or logs. Restrict Console access to authorized operators; application server SDK access is governed by project IAM, not Firestore Security Rules.

Before any recovery, verify the order's `status` is `paid` and compare `checkoutId`, `planId`, `amount`, and `userEmail` against the paid checkout in Chargily. The app verifies Chargily's webhook signature; never accept a screenshot or browser redirect as proof of payment. If the order is not paid, do not issue a license.

## LicenseSeat create outcome unknown

Search the LicenseSeat product's license list for metadata `order_id` equal to the Firestore `orderId`.

- **Exactly one matching license:** do not call create again. Confirm the plan and customer match the paid order and provide the evidence to the engineering owner. The current application has no operator fulfillment/recovery console, so do not edit Firestore workflow fields directly; the owner must use a reviewed recovery procedure to record the existing LicenseSeat result and continue email delivery.
- **No matching license:** check LicenseSeat activity records and contact LicenseSeat support if the outcome remains unclear. Absence in a listing may not prove the original request was not accepted. Do not issue a second license unless the provider or a qualified operator establishes that the create did not succeed. The current app has no supported event replay or operator reset tool; escalate to the engineering owner for a reviewed repair rather than editing Firestore or using the public checkout endpoint.
- **More than one matching license or a mismatch:** do not email any key. Escalate to the engineering owner and LicenseSeat support to determine the correct license and revoke any duplicate if appropriate.

## Resend outcome unknown

Use Resend activity/logs to search for the order-specific idempotency key `teacher-mate-license-<orderId>` and the recipient. If the message was accepted, do not send another message; provide the provider message ID and evidence to the engineering owner to record it through a reviewed recovery procedure. If Resend confirms no message was accepted, the owner must use an approved recovery process to resume delivery. The current app has no operator fulfillment/recovery console, so do not edit Firestore workflow fields or force an email replay directly. The service retries an ambiguous send only within a conservative 23-hour window, reusing the same Resend idempotency key. After that window, verify activity before any resend.

## Chargily checkout outcome unknown

Search Chargily's dashboard using the checkout ID if recorded, and order metadata (`orderId`) where available. Confirm whether the checkout exists and whether it is unpaid, paid or failed. A signed `checkout.paid` webhook can reconcile an order whose checkout-create response timed out; the server validates its persisted order metadata before processing it. Do not create another checkout for the same ambiguous intent. If the customer was charged but no matching Firestore order/webhook can be found, escalate to the payment operator and Chargily support; keep the original order reference.

## Limits and change controls

Firestore state and event claims survive process restarts and coordinate instances, but this system cannot make one atomic transaction across Firestore, Chargily, LicenseSeat and Resend. Provider dashboards are required to resolve ambiguous external responses. The app currently has no administrator workflow for reconciling an ambiguous fulfillment record; **until one is implemented, all manual repair must be performed by the engineering owner under a reviewed, restricted procedure.** Do not add a public endpoint that lets a browser mark orders paid, reset fulfillment, or replay provider calls. Record operator, timestamp, order ID, provider evidence and action in the incident record; never record the key itself.

## Official references

- [Chargily Pay V2 webhooks](https://dev.chargily.com/pay-v2/webhooks)
- [LicenseSeat API reference](https://licenseseat.com/docs/api-reference/)
- [LicenseSeat create-license guide](https://licenseseat.com/docs/api-reference-create-license/)
- [Resend send-email API and idempotency](https://resend.com/docs/api-reference/emails/send-email)
- [Firestore IAM](https://docs.cloud.google.com/firestore/docs/security/iam)
- [Cloud Run service identity](https://docs.cloud.google.com/run/docs/configuring/services/service-identity)

These steps describe operational guidance; they do not imply that any provider API or dashboard was accessed during testing.

