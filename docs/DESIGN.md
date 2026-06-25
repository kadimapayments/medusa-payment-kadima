# medusa-payment-kadima — Design

A Medusa v2 payment plugin that connects a merchant's store **directly** to Kadima's
gateway (cards) and ACH API. No middle gateway (no NMI). Card data never touches the
Medusa backend (Hosted Fields → SAQ-A scope).

> **Verified against `Kadima_Dashboard_API_COMPLETE.md`.** All five original Phase-0
> blockers are resolved in-document — see `PHASE-0-CONFIRMATION.md`. No outstanding
> design unknowns.

## Decisions (locked)

| Topic | Decision |
|---|---|
| Token model | **Single per-merchant** Bearer token, covers card + ACH (+ `terminal.id` / `dba.id`) |
| Packaging | **Standalone plugin** `medusa-payment-kadima`, two providers |
| Capture model (cards) | **Configurable** per store: `auth` (auth→capture) or `sale` (auth+capture) |
| PCI | **Hosted Fields** — browser performs the payment; backend reconciles via webhook |
| Session correlation | **`externalId`** (≤64 chars, unique/txn) = Medusa `session_id` |

## Two card flows (important)

- **A — Hosted Fields (new card):** browser charges directly (`HostedFields.create`
  with `externalId`). `authorizePayment` returns `pending`; the `transaction/create`
  webhook (matched by `externalId`) authorizes the Medusa session. SAQ-A.
- **B — Server-to-server (stored token / recurring / MOTO):** `authorizePayment`
  POSTs a CustomerVault card token to `/payment/auth` (or `/payment/sale`).

## Two providers, one plugin

Registered as separate `identifier`s so Medusa can pick per session:

- `kadima-card` — synchronous. `terminal.id`. Auth/capture/refund map 1:1 to API calls.
- `kadima-ach`  — asynchronous. `dba.id`. Submit → settle/return arrive via webhook.

Both sit on a shared `KadimaCardClient` / `KadimaAchClient` (auth, retry, errors,
webhook-signature verify).

## Kadima surface (from `docs/2-Payment Gateway API.pdf`, `4-Webhooks.pdf`, `ACH Agreement V1.7.pdf`)

**Cards** — `https://gateway.kadimadashboard.com` (sandbox `https://sandbox-gateway.kadimadashboard.com`), `Authorization: Bearer <token>`, merchant = `terminal.id`:
- `POST /payment/sale` · `POST /payment/auth` · `POST /payment/{id}/capture` ·
  `POST /payment/{id}/refund` · `POST /payment/card-authentication` (zero-$ verify) ·
  `POST /payment/generate-token`
- Hosted Fields: `POST https://kadimadashboard.com/api/hosted-fields/token` + `HostedFields.js`
- Result: `status.status ∈ {Approved, Declined, Error}`, `captured`/`refunded` booleans, `card.token` when `card.save:"Yes"`

**ACH** — `https://kadimadashboard.com/api/ach`, Bearer token, merchant = `dba.id`:
- `POST /api/ach` (`transactionType: Debit|Credit`) · `POST /api/ach/{id}/{action}` (`suspend|resume|void|verify`) · `POST /api/ach/{id}/cancel`
- Vault: `/api/ach/customer` (CRUD) · `/api/ach/customer/{id}/account`
- SEC: PPD & CCD (debit+credit), WEB & TEL (debit only)
- Status: `Pending|Submitted → Transmitted → Settled | Returned` (Returned is terminal)

**Webhooks** — both card & ACH POST to our endpoint. Signature =
`SHA-512(webhookSignature + id + module + action + date)`. Modules: `transaction`,
`ach`, `chargeback`.

## Method mapping

### `kadima-card`
| Medusa | Kadima | Notes |
|---|---|---|
| `initiatePayment` | `POST /api/hosted-fields/token` | returns HF token + `terminal.id` to storefront; no money |
| `authorizePayment` | `capture_method=auth` → `POST /payment/auth`; `=sale` → `POST /payment/sale` | uses `card.token` from HF; `Approved`→`authorized`, `Declined`→throw |
| `capturePayment` | `POST /payment/{id}/capture` | no-op if already `sale`; supports partial |
| `refundPayment` | `POST /payment/{id}/refund` | unsettled→reversal w/ auth code; settled→offline refund; partial ok |
| `cancelPayment` | `POST /payment/{id}/refund` (full) | pre-capture void via reversal |
| `getPaymentStatus` | from stored `data` (+ retrieve) | `captured`/`refunded`/`status` → Medusa status |
| `updatePayment` | re-mint HF token if amount changed | |
| `deletePayment` | none | return data as-is |
| `getWebhookActionAndData` | `transaction/create`, `chargeback/*` | correlate via field from Phase-0 #2 |
| `createAccountHolder`/`savePaymentMethod`/`listPaymentMethods` | `card.save:"Yes"` token store | optional, Phase 3 |

### `kadima-ach` (async mapped onto sync contract)
| Medusa | Kadima | Notes |
|---|---|---|
| `initiatePayment` | (optional) vault lookup `/api/ach/customer` | returns context |
| `authorizePayment` | `POST /api/ach` (`Debit`) | item `Pending` → return **`authorized`** (NOT captured — funds unsettled) |
| `capturePayment` | none | real capture = `Settled` webhook, delivered later |
| `getWebhookActionAndData` | `ach/updateStatus` | `Settled`→`captured`, `Returned`→`failed`, `ach/create`→ack |
| `refundPayment` | `POST /api/ach/{id}/void` (pre-transmit) or `POST /api/ach` `Credit` (post-settle) | |
| `cancelPayment` | `POST /api/ach/{id}/cancel` or `/void` | only before transmit |
| `getPaymentStatus` | stored status | map ACH lifecycle → Medusa status |

**Core ACH principle:** submit = `authorized`; the `Settled` webhook drives
`captured`. Never report captured at submit time.

## Webhook handler

One Medusa route per provider (or one shared route keyed by `module`):
1. Verify `SHA-512(secret + id + module + action + date)` against `Webhook-Signature`.
   (Reuse the exact scheme from the website repo `api/webhooks/kadima.js`.)
2. `getWebhookActionAndData` returns `{ action, data: { session_id, amount } }`.
3. Medusa authorizes/captures/fails the session internally.

`session_id` recovery depends on Phase-0 question #2.

## Multi-tenant config (per store)

```ts
{
  // per-merchant credentials (Phase-0 #1)
  cardToken, achToken,            // may be one token if Kadima confirms shared scope
  terminalId,                     // card merchant id
  dbaId,                          // ACH merchant id
  webhookSecret,
  // behavior
  captureMethod: "auth" | "sale", // default "auth"
  sandbox: boolean,
  achSecCode: "PPD" | "CCD" | "WEB" | "TEL",
}
```

## Phased plan

- **0 Confirm** (this doc + `PHASE-0-CONFIRMATION.md`) — no provider logic until #1,#2 answered.
- **1 Clients** — `KadimaCardClient`, `KadimaAchClient`, webhook verify, error/decline mapping. Unit-tested on fixtures.
- **2 Card provider** + Hosted Fields storefront snippet. E2E sale on sandbox.
- **3 Card webhooks** + chargebacks + stored cards (account holder / save / list).
- **4 ACH provider** + Customer Vault, async authorize→submit.
- **5 ACH webhooks** — `Settled`→capture, `Returned`→fail, reconciliation.
- **6 Hardening** — idempotency, partial capture/refund, admin config UI, decline-reason map, docs.

## Confirmed capabilities to fold into later phases

The complete reference documents more than the minimum gateway surface:
- **CustomerVault** — customers / cards / billing / shipping / **recurring** →
  backs `createAccountHolder` / `savePaymentMethod` / `listPaymentMethods` and any
  Medusa subscription work (Phase 3).
- **Account Updater** — auto-refresh of stored card expiries (Phase 3/6).
- **3DSecure** — Create/Check + test cards; driven by Hosted Fields `3ds:true` and
  `3ds.start`/`3ds.success` events (Phase 2/3).
- **Hosted Form** — drop-in alternative to Hosted Fields if a merchant wants a full
  hosted page instead of embedded fields.
- **Partial Capture / Partial Refund** — distinct endpoints; map to Medusa partials.
- **Reporting** — authorizations / batches / payouts / chargebacks / statements /
  reserve; useful for reconciliation + admin widgets (Phase 6).

## Webhook action map (confirmed)

| module/action | Medusa |
|---|---|
| `transaction/create` (captured=false) | `authorized` |
| `transaction/create` (captured=true)  | `captured` |
| `transaction/refund` | `captured` (refund recorded) |
| `transaction/reccuring` [sic], `transaction/highRiskAuthorizationWarning` | none |
| `ach/updateStatus` → `Settled` | `captured` |
| `ach/updateStatus` → `Returned` | `failed` |
| `ach/create`, `ach/createCustomer` | ack only |

## Open questions

None blocking. Remaining items are operational (obtain sandbox token, `terminal.id`,
`dba.id`, webhook secret) — see `PHASE-0-CONFIRMATION.md`.
