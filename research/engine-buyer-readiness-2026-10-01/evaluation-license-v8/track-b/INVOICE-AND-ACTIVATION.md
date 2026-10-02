# Invoice and activation

**DRAFT 2026-10-02.** No invoice is sent, no payment is taken and nothing is activated under this preparation task.

## Payment process: NOT HELD
No authorized payment process exists. The site's `checkout_url` values are empty (IP_SALE_TRACKER revision 27). No new account or checkout is created by this task. **Owner decision needed:** pick one method already available to you, for example an invoice from a payment service you already use, or a bank transfer. Record it in the order form as `payment_method`.

## Steps for one sale (in order)
1. A named buyer asks for the evaluation. The owner decides to send the offer.
2. Fill in the order form. `node tools/validate-order.mjs order.json` must pass at the `issue` stage.
3. The lawyer reviews the agreement once (owner's plan), and `agreement_reviewed_by_lawyer` is set to `true`.
4. Both parties sign. Record the reference in `signed_agreement_reference`.
5. Issue the invoice for USD 1,000 plus applicable tax, using the chosen payment method.
6. Payment is received. Record it in `payment_received_reference`. `validate-order.mjs order.json sold` must pass. The status becomes **SOLD**.
7. Activation: send the package tarball and its SHA-256, and an `entitlement.json` with the licensee name, an expiry date 30 days from activation, and `max_attempts` of 300. Record `activation_date`. The status becomes **ACTIVE**.
8. Delivery acceptance within 5 business days (SUPPORT-AND-ACCEPTANCE.md).
9. Closeout at the end of the term: the licensee certifies deletion. Record the credit window (180 days) in LICENSE-ENCUMBRANCE-REGISTER.json. The status becomes **COMPLETED**, then **CLOSED**.
