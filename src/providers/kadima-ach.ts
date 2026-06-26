import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { BigNumber } from "@medusajs/framework/utils"
import { KadimaAchClient } from "../lib/kadima-ach-client"
import { verifySignature } from "../lib/webhook"
import { KadimaAchOptions, DASHBOARD_HOSTS } from "../types"

/**
 * ACH provider. ASYNCHRONOUS. Merchant = dba.id.
 *
 * Core mapping: submit (POST /api/ach) = "authorized". The `Settled` webhook
 * drives "captured"; `Returned` drives "failed". We never report captured at
 * submit time because funds are not yet settled.
 *
 * STATUS: Phase-1 skeleton; gated on Phase-0 #2 (correlation field), #3 (ACH
 * sandbox), #5 (return correlation). See docs/PHASE-0-CONFIRMATION.md.
 */
class KadimaAchProviderService extends AbstractPaymentProvider<KadimaAchOptions> {
  static identifier = "kadima-ach"

  protected client: KadimaAchClient
  protected options_: KadimaAchOptions

  constructor(container: Record<string, unknown>, options: KadimaAchOptions) {
    super(container, options)
    this.options_ = options
    this.client = new KadimaAchClient(options)

    // Startup diagnostics — surface env/credential mismatches in deploy logs.
    const sb = !!options.sandbox
    console.info(
      `[kadima-ach] init — sandbox=${sb} · ` +
        `host=${sb ? DASHBOARD_HOSTS.sandbox : DASHBOARD_HOSTS.prod}/api/ach · ` +
        `dba=${options.dbaId ?? "(unset)"} · token=${options.apiToken ? "set" : "MISSING"}`
    )
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    return {
      id: `kadima_ach_init`,
      data: { amount: input.amount, currency_code: input.currency_code },
    }
  }

  /**
   * Submit the debit. The item is created `Pending` → we return `authorized`
   * (funds are NOT settled yet). The `Settled` webhook later drives `captured`.
   *
   * Correlation: we stamp `customer.identifier = session_id` so the achObject on
   * the webhook carries our Medusa session id back to us.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const sessionId = input.data?.session_id as string
    const inlineCustomer = (input.data?.customer as Record<string, unknown>) ?? {}

    const created = await this.client.debit({
      amount: Number(input.data?.amount),
      tax: input.data?.tax != null ? Number(input.data.tax) : undefined,
      customerId: input.data?.customerId as string | undefined,
      accountId: input.data?.accountId as string | undefined,
      // inline bank account (top-level fields) for a first-time payer
      accountName: input.data?.accountName as string | undefined,
      accountNumber: input.data?.accountNumber as string | undefined,
      routingNumber: input.data?.routingNumber as string | undefined,
      accountType: input.data?.accountType as "Checking" | "Savings" | undefined,
      saveCustomer: Boolean(input.data?.saveCustomer),
      customer: { ...inlineCustomer, identifier: sessionId },
    })
    return {
      status: "authorized",
      data: { id: created.id, achStatus: "Pending" },
    }
  }

  /** No synchronous capture for ACH — real capture is the Settled webhook. */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const id = String(input.data?.id)
    const status = input.data?.achStatus
    // Before transmit → void; after settle → offsetting credit (PPD/CCD only).
    if (status === "Pending" || status === "Submitted") {
      await this.client.action(id, "void")
      return { data: { ...input.data, voided: true } }
    }
    const credit = await this.client.credit({
      amount: Number(input.amount),
      customerId: input.data?.customerId as string | undefined,
    })
    return { data: { ...input.data, creditId: credit.id } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const id = String(input.data?.id)
    // void if still voidable (Held/Pending/Submitted); cancel ends a recurring.
    await this.client.action(id, "void")
    return { data: { ...input.data, canceled: true } }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const s = input.data?.achStatus
    switch (s) {
      case "Settled":
        return { status: "captured", data: input.data ?? {} }
      case "Returned":
      case "Voided":
        return { status: "canceled", data: input.data ?? {} }
      default:
        return { status: "authorized", data: input.data ?? {} }
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: { ...input.data, amount: input.amount } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const data = payload.data as Record<string, any>
    const headers = payload.headers as Record<string, string>
    const ok = verifySignature(
      this.options_.webhookSecret,
      { id: data.id, module: data.module, action: data.action, date: data.date },
      headers["webhook-signature"] || headers["Webhook-Signature"]
    )
    if (!ok || data.module !== "ach") return { action: "not_supported" }

    // The achObject is the webhook `data`. We stamped customer.identifier = session_id.
    const ach = (data.data ?? {}) as Record<string, any>
    const sessionId = (ach.customer?.identifier as string) ?? ""
    const amount = new BigNumber(Number(ach.amount ?? 0))
    const status = ach.transactionStatus

    if (data.action === "updateStatus" && status === "Settled") {
      return { action: "captured", data: { session_id: sessionId, amount } }
    }
    if (data.action === "updateStatus" && (status === "Returned" || status === "Voided")) {
      return { action: "failed", data: { session_id: sessionId, amount } }
    }
    return { action: "not_supported" }
  }
}

export default KadimaAchProviderService
