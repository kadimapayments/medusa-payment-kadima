import { CARD_HOSTS, DASHBOARD_HOSTS, KadimaCardOptions } from "../types"
import { assertApproved, isRetryable, KadimaError } from "./errors"

/**
 * Client over the Kadima card GATEWAY (gateway.kadimadashboard.com) and the
 * dashboard-hosted endpoints for Hosted Fields (kadimadashboard.com/api/...).
 *
 * Endpoints (verified against Kadima_Dashboard_API_COMPLETE.md):
 *   POST {gateway}/payment/auth                    auth-only
 *   POST {gateway}/payment/sale                    auth + capture
 *   POST {gateway}/payment/<id>/capture            capture an auth
 *   POST {gateway}/payment/<id>/refund             refund/void
 *   POST {gateway}/payment/card-authentication     zero-dollar verify
 *   POST {gateway}/payment/generate-token          tokenize only
 *   POST {dashboard}/api/hosted-fields/token       mint a Hosted Fields token
 *   POST {dashboard}/api/hosted-fields/card-token  fetch saved card token post-payment
 *
 * Card data never passes through here in the Hosted Fields flow; only a stored
 * `card.token` is used for server-to-server (vault / recurring / MOTO) charges.
 */
export class KadimaCardClient {
  private readonly gatewayBase: string
  private readonly dashboardBase: string

  constructor(private readonly opts: KadimaCardOptions) {
    this.gatewayBase = opts.sandbox ? CARD_HOSTS.sandbox : CARD_HOSTS.prod
    this.dashboardBase = opts.sandbox ? DASHBOARD_HOSTS.sandbox : DASHBOARD_HOSTS.prod
  }

  // --- Hosted Fields: mint a single-use token for the storefront ----------
  // Request: { expiration<=30, terminal, domain, saveCard, "3ds" }
  async createHostedFieldsToken(input: {
    domain: string
    saveCard?: "required" | "optional" | "disabled"
    threeds?: boolean
    expiration?: number
  }): Promise<HostedFieldsToken> {
    return this.request<HostedFieldsToken>(
      `${this.dashboardBase}/api/hosted-fields/token`,
      {
        terminal: this.opts.terminalId,
        domain: input.domain,
        saveCard: input.saveCard ?? "disabled",
        "3ds": input.threeds ?? false,
        expiration: Math.min(input.expiration ?? 30, 30),
      }
    )
  }

  // Fetch the saved card token after a Hosted Fields payment (if saveCard allowed).
  async getHostedFieldsCardToken(accessToken: string): Promise<Record<string, any>> {
    return this.request(`${this.dashboardBase}/api/hosted-fields/card-token`, {
      accessToken,
    })
  }

  // --- Server-to-server charges (stored token / recurring / MOTO) ----------
  async auth(input: CardChargeInput): Promise<KadimaCardTxn> {
    const resp = await this.request<KadimaCardTxn>(
      `${this.gatewayBase}/payment/auth`,
      this.buildChargeBody(input)
    )
    assertApproved(resp)
    return resp
  }

  async sale(input: CardChargeInput): Promise<KadimaCardTxn> {
    const resp = await this.request<KadimaCardTxn>(
      `${this.gatewayBase}/payment/sale`,
      this.buildChargeBody(input)
    )
    assertApproved(resp)
    return resp
  }

  // POST /payment/<id>/capture  body: { terminal, amount?, partial? }
  async capture(
    id: string | number,
    amount?: number,
    partial?: { total: number; sequence: number }
  ): Promise<KadimaCardTxn> {
    const resp = await this.request<KadimaCardTxn>(
      `${this.gatewayBase}/payment/${id}/capture`,
      {
        terminal: { id: this.opts.terminalId },
        ...(amount != null ? { amount } : {}),
        ...(partial ? { partial } : {}),
      }
    )
    assertApproved(resp)
    return resp
  }

  // POST /payment/<id>/refund  body: { terminal, amount? }
  async refund(id: string | number, amount?: number): Promise<KadimaCardTxn> {
    const resp = await this.request<KadimaCardTxn>(
      `${this.gatewayBase}/payment/${id}/refund`,
      {
        terminal: { id: this.opts.terminalId },
        ...(amount != null ? { amount } : {}),
      }
    )
    assertApproved(resp)
    return resp
  }

  /** Zero-dollar card validity check (no funds held). */
  async cardAuthentication(input: CardChargeInput): Promise<KadimaCardTxn> {
    return this.request(`${this.gatewayBase}/payment/card-authentication`, {
      ...this.buildChargeBody(input),
      amount: 0,
    })
  }

  /** Tokenize a card without an auth or sale. */
  async generateToken(input: CardChargeInput): Promise<KadimaCardTxn> {
    return this.request(`${this.gatewayBase}/payment/generate-token`, {
      terminal: { id: this.opts.terminalId },
      source: input.source ?? "Internet",
      card: this.buildCard(input),
    })
  }

  private buildChargeBody(input: CardChargeInput) {
    return {
      terminal: { id: this.opts.terminalId },
      amount: input.amount,
      source: input.source ?? "Internet",
      level: input.level ?? 1,
      card: this.buildCard(input),
      // externalId is the merchant-supplied correlation key (<=64 chars, unique).
      ...(input.externalId ? { externalId: input.externalId } : {}),
      ...(input.contact ? { contact: input.contact } : {}),
      ...(input.order ? { order: input.order } : {}),
      ...(input.isRecurring ? { isRecurring: "Yes" } : {}),
    }
  }

  private buildCard(input: CardChargeInput) {
    if (input.cardToken) {
      // Saved-card / vault charge — token only, no PAN.
      return {
        token: input.cardToken,
        ...(input.store ? { store: "Yes" } : {}),
        ...(input.networkTransactionId
          ? { networkTransactionId: input.networkTransactionId }
          : {}),
      }
    }
    // Raw card (MOTO / S2S where the merchant is PCI-scoped). exp format: mm/yy.
    return {
      name: input.card?.name,
      number: input.card?.number,
      exp: input.card?.exp,
      cvv: input.card?.cvv,
      ...(input.card?.address ? { address: input.card.address } : {}),
      ...(input.save ? { save: "Yes" } : {}),
      ...(input.store ? { store: "Yes" } : {}),
    }
  }

  // --- transport: bearer auth + retry on 5xx/network/retryable declines ----
  private async request<T = any>(url: string, body: unknown, attempt = 0): Promise<T> {
    let resp: Response
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.opts.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    } catch (e) {
      if (attempt < 2) return this.request<T>(url, body, attempt + 1)
      throw new KadimaError(`Network error calling Kadima: ${String(e)}`, "Error")
    }

    const text = await resp.text()
    const json = text ? safeJson(text) : {}

    if (resp.status >= 500 && attempt < 2) {
      await delay(2 ** attempt * 500)
      return this.request<T>(url, body, attempt + 1)
    }
    if (!resp.ok) {
      const msg = (json as any)?.message ?? text
      throw new KadimaError(`Kadima HTTP ${resp.status}: ${msg}`, "Error", undefined, json)
    }
    const reason = (json as any)?.status?.reason
    if (isRetryable(reason) && attempt < 2) {
      await delay(2 ** attempt * 500)
      return this.request<T>(url, body, attempt + 1)
    }
    return json as T
  }
}

export interface HostedFieldsToken {
  access_token: string
  issued_at: number
  expiration: number
  expires_at: string
}

export interface CardChargeInput {
  amount: number
  source?: "Internet" | "Phone" | "Mail"
  level?: 1 | 2 | 3
  externalId?: string // correlation key, <=64 chars, unique per transaction
  isRecurring?: boolean
  store?: boolean // COF/MIT (Visa)
  networkTransactionId?: string
  // Either a stored token ...
  cardToken?: string
  save?: boolean // tokenize for reuse → returns card.token
  // ... or raw card data (only when the merchant is PCI-scoped for S2S).
  card?: {
    name?: string
    number?: number | string
    exp?: string // mm/yy
    cvv?: number | string
    address?: {
      country?: string
      state?: string
      city?: string
      street?: string
      zip?: string
    }
  }
  contact?: { name?: string; phone?: string; email?: string }
  order?: Record<string, unknown>
}

/** Card transaction response (auth/sale/capture/refund). */
export interface KadimaCardTxn {
  id: number
  type: string // "Auth" | "Sale" | "Capture" | "Return" | "GenerateToken"
  amount: string
  authCode?: string | null
  captured: boolean
  refunded: boolean
  externalId?: string | null
  parent?: { id: number | null }
  card?: { token?: string; bin?: number; name?: string | null; number?: number; exp?: string }
  status?: { status?: "Approved" | "Declined" | "Error"; reason?: string | null }
  history?: unknown[]
  createdOn?: string
  updatedOn?: string
}

function safeJson(t: string): unknown {
  try {
    return JSON.parse(t)
  } catch {
    return { raw: t }
  }
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
