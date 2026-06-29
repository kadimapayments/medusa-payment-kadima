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
            id: "kadima-card",
            options: {
              apiToken: process.env.KADIMA_TOKEN,
              terminalId: Number(process.env.KADIMA_TERMINAL_ID),
              dbaId: Number(process.env.KADIMA_DBA_ID), // for saved cards
              webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,
              captureMethod: "auth", // or "sale"
              storeUrl: process.env.KADIMA_STORE_URL, // REQUIRED for Hosted Fields — your storefront URL
              sandbox: process.env.KADIMA_SANDBOX === "true",
            },
          },
          {
            resolve: "medusa-payment-kadima/providers/kadima-ach",
            id: "kadima-ach",
            options: {
              apiToken: process.env.KADIMA_TOKEN,
              dbaId: Number(process.env.KADIMA_DBA_ID),
              webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,
              secCode: "WEB",
              sandbox: process.env.KADIMA_SANDBOX === "true",
            },
          },
        ],
      },
    },
  ],
})
```

> ⚠️ **Set `sandbox` explicitly — do not derive it from `NODE_ENV`.** Most hosting
> platforms (Railway, Render, Vercel, Heroku, Fly) set `NODE_ENV=production`, so
> `NODE_ENV !== "production"` silently evaluates to `false` and your test build hits
> the **live** Kadima hosts with sandbox credentials → `HTTP 401: invalid credentials`.
> While testing, set `KADIMA_SANDBOX=true` in your env; unset it (or `false`) for production.
> `sandbox: true` uses `sandbox.kadimadashboard.com` / `sandbox-gateway.kadimadashboard.com`;
> `false` uses the live hosts. The token, terminal ID and DBA ID must come from the
> **same** environment as the flag (a sandbox token on a live host, or vice-versa, is a 401).

On startup each provider logs its resolved configuration so mismatches are obvious, e.g.:

```
[kadima-card] init — sandbox=true · gateway=https://sandbox-gateway.kadimadashboard.com · dashboard=https://sandbox.kadimadashboard.com · terminal=404 · token=set
```

If you see `token=MISSING`, the env var isn't set in your deployment. If `sandbox` or the
host is wrong for your token, fix the flag and redeploy.

Enable the providers in your sales channel / region, point your Kadima webhook at
`https://<your-store>/hooks/payment/kadima-card` (and `/kadima-ach`), and add the
storefront components from [`storefront/`](./storefront/README.md).

### Hosted Fields (card) requirements

Two things trip up the card flow specifically:

1. **Token permission.** The API token must have the **`api-creditcard-payment-read-write`**
   permission (Kadima dashboard → Developers → Tokens). Without it, the Hosted Fields
   token mint / card processing fails. (A token with only reporting/tickets scopes will
   not work for card payments.)
2. **`storeUrl` / domain.** Hosted Fields locks the card iframe to a domain. Set
   `storeUrl` (`KADIMA_STORE_URL`) to the **exact origin your storefront runs on**
   (e.g. `https://shop.example.com`, or your Railway/preview URL while testing). If the
   page origin doesn't match, Kadima raises `hostedFields.error: "Invalid Domain"`.
   The provider throws an actionable error at session creation if `storeUrl` is unset.

The plugin loads the `HostedFields.js` asset that matches `sandbox` automatically
(`sandbox.kadimadashboard.com` vs `kadimadashboard.com`) and passes it to the storefront
component as `data.hfScriptUrl` — you don't hard-code it.

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
