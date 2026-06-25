# Phase 0 — RESOLVED against the complete API reference

This integration connects a **Medusa.js** store directly to **Kadima**'s payment
gateway (cards) and ACH API, with no middle gateway (no NMI).

The five open questions from the first draft are now **answered** by
`Kadima_Dashboard_API_COMPLETE.md`. Recorded here for the build.

Status legend: ☑ confirmed · ☐ operational (just need the value)

---

## 1. ☑ Token model — single per-merchant Bearer token

Each merchant manages **one Dashboard Access Token** (Bearer) that covers **both**
the card gateway and the ACH API. No facilitator setup; merchant pastes their token
+ `terminal.id` + `dba.id` into Medusa admin.
> Ref: "Our API uses Access Token to authenticate requests… Bearer Authentication."

## 2. ☑ Session correlation — `externalId`

`externalId` (string, **max 64 chars**, must be **unique per transaction**) is the
merchant-supplied reference. Set it = Medusa `session_id`.
- **Cards:** passed at Hosted Fields creation (`HostedFields.create({ externalId })`)
  or in the server-to-server `/payment/*` body. Echoed on the `transaction/create`
  webhook and in Transaction Reporting (filterable).
- **ACH:** correlate by the returned ACH `id` (the `achObject` rides on the
  `ach/updateStatus` webhook); `customer.identifier` available for the payer.
> Ref: "externalId … Max length: 64 characters … provide unique IDs for every transaction."

## 3. ☑ Sandbox hosts

- Cards: `https://sandbox-gateway.kadimadashboard.com`
- Dashboard + ACH: `https://sandbox.kadimadashboard.com`

## 4. ☑ Idempotency / duplicate protection

`externalId` doubles as the idempotency key — Kadima's duplicate detection keys on
the external reference number. Send a unique `externalId` per attempt; safe to retry
a timed-out request with the same `externalId`.

## 5. ☑ ACH return correlation

`ach/updateStatus` carries the full `achObject` (includes `id` + `status`). On
`status: "Returned"` → fail the Medusa payment matched by stored ACH `id`. Same for
chargeback events under the `chargeback` module.

---

## Operational — values to obtain from the merchant's dashboard (sandbox)

- ☐ Dashboard Access Token (sandbox) — one token, card + ACH
- ☐ `terminal.id` (card)
- ☐ `dba.id` (ACH)
- ☐ Webhook Signature secret(s) — one per Webhook URL
- ☐ Hosted Fields enabled on the sandbox terminal; allowed `domain` registered

No remaining blockers. Phase 1 (clients) and Phase 2 (card via Hosted Fields) can
start immediately.
