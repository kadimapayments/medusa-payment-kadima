import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import KadimaCardProviderService from "./providers/kadima-card"
import KadimaAchProviderService from "./providers/kadima-ach"

/**
 * Registers BOTH providers under the Payment module. In medusa-config.ts:
 *
 *   modules: [
 *     {
 *       resolve: "@medusajs/medusa/payment",
 *       options: {
 *         providers: [
 *           {
 *             resolve: "medusa-payment-kadima/providers/kadima-card",
 *             id: "kadima-card",
 *             options: {
 *               apiToken: process.env.KADIMA_CARD_TOKEN,
 *               terminalId: Number(process.env.KADIMA_TERMINAL_ID),
 *               webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,
 *               captureMethod: "auth",      // or "sale"
 *               // Your storefront URL — Hosted Fields locks the card iframe to it.
 *               storeUrl: process.env.KADIMA_STORE_URL,
 *               // Set explicitly — NODE_ENV is "production" on most hosts, which
 *               // would silently send sandbox creds to the LIVE host (→ 401).
 *               sandbox: process.env.KADIMA_SANDBOX === "true",
 *             },
 *           },
 *           {
 *             resolve: "medusa-payment-kadima/providers/kadima-ach",
 *             id: "kadima-ach",
 *             options: {
 *               apiToken: process.env.KADIMA_ACH_TOKEN,
 *               dbaId: Number(process.env.KADIMA_DBA_ID),
 *               webhookSecret: process.env.KADIMA_WEBHOOK_SECRET,
 *               secCode: "WEB",
 *               sandbox: process.env.KADIMA_SANDBOX === "true",
 *             },
 *           },
 *         ],
 *       },
 *     },
 *   ]
 */
export default ModuleProvider(Modules.PAYMENT, {
  services: [KadimaCardProviderService, KadimaAchProviderService],
})

export { KadimaCardProviderService, KadimaAchProviderService }
