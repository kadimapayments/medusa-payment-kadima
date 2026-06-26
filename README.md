# medusa-payment-kadima

Medusa v2 payment provider that connects a store **directly** to Kadima — cards and
ACH — with **no middle gateway** (no NMI). Any merchant already boarded with Kadima
can plug their own terminal/DBA credentials into Medusa and process natively.

- **Two providers:** `kadima-card` (synchronous, `terminal.id`) and `kadima-ach`
  (asynchronous, `dba.id`).
- **Per-merchant tokens:** each merchant supplies their own Kadima API token.
- **Configurable card capture:** `auth` (authorize → capture) or `sale` (both).
- **PCI SAQ-A:** card data is collected by Kadima Hosted Fields in the browser; the
  backend only ever handles tokens.

## Install

```bash
npm install medusa-payment-kadima
```

## Configure

Register both providers on the Payment module in `medusa-config.ts`:

```ts
module.exports = defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "medusa-payment-kadima/providers/kadima-card",
            // No `id` needed — each provider class has a distinct `identifier`,
            // so the provider id becomes `pp_kadima-card`. (Setting `id: "x"`
            // would make it `pp_kadima-card_x` and change the webhook path.)
            options: {
              apiToken: process.env.KADIMA_TOKEN,
              terminalId: Number(process.env.KADIMA_TERMINAL_ID),
              dbaId: Number(process.env.KADIMA_DBA_ID), // for saved cards
              webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,
              captureMethod: "auth", // or "sale"
              sandbox: process.env.NODE_ENV !== "production",
            },
          },
          {
            resolve: "medusa-payment-kadima/providers/kadima-ach",
            options: {
              apiToken: process.env.KADIMA_TOKEN,
              dbaId: Number(process.env.KADIMA_DBA_ID),
              webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,
              secCode: "WEB",
              sandbox: process.env.NODE_ENV !== "production",
            },
          },
        ],
      },
    },
  ],
})
```

Enable the providers in your sales channel / region, point your Kadima webhook at
`https://<your-store>/hooks/payment/kadima-card` (and `/kadima-ach`), and add the
storefront components from [`storefront/`](./storefront/README.md).

> The webhook path segment is the provider id **without** the `pp_` prefix —
> Medusa re-adds it internally (`pp_<segment>`). With the config above the ids are
> `pp_kadima-card` / `pp_kadima-ach`, so the paths are `/hooks/payment/kadima-card`
> and `/hooks/payment/kadima-ach`. If you set an `id`, the path changes accordingly.

## Status

Card + ACH clients, both providers, CustomerVault, and webhook verification are
reference-verified against the canonical Kadima API and **sandbox-tested live**
(auth → capture → refund, ACH debit, full vault flow). The providers **compile clean
against `@medusajs/framework` 2.17** and the built ESM package loads with the correct
provider identifiers. Build with `npm run build` (tsup → `.medusa/server`).

| Module | Verified |
|---|---|
| Card client + Hosted Fields | 20 claims · live sandbox |
| ACH client + provider | 18 claims · live sandbox |
| CustomerVault (saved cards) | 12 claims · live sandbox |
| Webhook signature | 7 unit tests pass |
| Providers vs `@medusajs/framework` | `tsc` clean + runtime load OK |

**Before production:** set a strong encryption/secret env, switch `sandbox:false`
with live per-merchant credentials, register the webhook URL, and run a checkout
end-to-end in your Medusa app.

## Layout

```
docs/
  DESIGN.md                 Architecture, method mapping, phased plan
  PHASE-0-CONFIRMATION.md   Questions + sandbox credentials needed before coding
src/
  index.ts                  Registers both providers on the Payment module
  types.ts                  Per-merchant options, hosts, status enums
  lib/
    kadima-card-client.ts   gateway.kadimadashboard.com + Hosted Fields token
    kadima-ach-client.ts    kadimadashboard.com/api/ach + Customer Vault
    webhook.ts              SHA-512(secret+id+module+action+date) verify
    errors.ts               Decline classification / KadimaError
  providers/
    kadima-card.ts          Card provider (AbstractPaymentProvider)
    kadima-ach.ts           ACH provider (async → Medusa sync contract)
  storefront/
    hosted-fields-example.md  Browser card-collection contract
```

## Reference docs (in the website repo)

`docs/2-Payment Gateway API.pdf`, `docs/4-Webhooks.pdf`, `docs/ACH Agreement V1.7.pdf`,
and the boarding webhook scheme in `api/webhooks/kadima.js`.

## Configure

See the example block in `src/index.ts` and `.env.example`.
