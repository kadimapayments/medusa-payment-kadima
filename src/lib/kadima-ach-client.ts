import { DASHBOARD_HOSTS, KadimaAchOptions } from "../types"

/**
 * Client over the Kadima ACH API (kadimadashboard.com/api/ach).
 *
 * Verified against Kadima_Dashboard_API_COMPLETE.md:
 *   POST   /api/ach                      create a Debit/Credit (returns { id })
 *   GET    /api/ach/<id>                  view a transaction
 *   POST   /api/ach/<id>/<action>        void | cancel | verify
 *   POST   /api/ach/customer             create a vault customer
 *   POST   /api/ach/customer/<id>/account add a bank account to a customer
 *
 * ACH is ASYNCHRONOUS: create returns status Pending; settlement (`Settled`) or
 * failure (`Returned`) arrive later via the ach/updateStatus webhook. So a debit
 * create means "submitted", not "captured".
 *
 * Request field names are exact and case-sensitive: `SECCode`, `transactionType`,
 * `accountName`, `accountNumber`, `routingNumber`, `accountType`, `dba.id`.
 */
export class KadimaAchClient {
  private readonly base: string

  constructor(private readonly opts: KadimaAchOptions) {
    this.base = `${opts.sandbox ? DASHBOARD_HOSTS.sandbox : DASHBOARD_HOSTS.prod}/api/ach`
  }

  // Create returns { id }. NOTE: id is a string in the minimal response but
  // numeric in the save-customer response — treat it as string | number.
  /** Create a debit. Returns the new ACH transaction id. */
  async debit(input: AchTxnInput): Promise<{ id: string | number }> {
    return this.request(this.base, "POST", this.buildBody(input, "Debit"))
  }

  /** Offsetting credit — refunds a settled debit (PPD/CCD only). */
  async credit(input: AchTxnInput): Promise<{ id: string | number }> {
    return this.request(this.base, "POST", this.buildBody(input, "Credit"))
  }

  /** void | cancel | verify  (void only while Held/Pending/Submitted). */
  async action(id: string | number, action: "void" | "cancel" | "verify") {
    return this.request(`${this.base}/${id}/${action}`, "POST")
  }

  async get(id: string | number): Promise<KadimaAchTxn> {
    return this.request(`${this.base}/${id}`, "GET")
  }

  // --- Customer Vault ------------------------------------------------------
  async createCustomer(data: Record<string, unknown>): Promise<{ id: string }> {
    return this.request(`${this.base}/customer`, "POST", data)
  }
  async addAccount(customerId: string | number, account: Record<string, unknown>) {
    return this.request(`${this.base}/customer/${customerId}/account`, "POST", account)
  }

  private buildBody(input: AchTxnInput, transactionType: "Debit" | "Credit") {
    const body: Record<string, unknown> = {
      amount: input.amount,
      transactionType,
      SECCode: input.secCode ?? this.opts.secCode ?? "WEB",
      dba: { id: this.opts.dbaId },
      ...(input.tax != null ? { tax: input.tax } : {}),
      ...(input.memo ? { memo: input.memo } : {}),
      ...(input.addendaText ? { addendaText: input.addendaText } : {}),
    }

    if (input.customerId) {
      // Existing vault customer (+ optional specific saved account).
      body.customer = { id: input.customerId }
      if (input.accountId) body.account = { id: input.accountId }
    } else {
      // New inline bank account. Bank fields are TOP-LEVEL, not nested.
      body.accountName = input.accountName
      body.accountNumber = input.accountNumber
      body.routingNumber = input.routingNumber
      body.accountType = input.accountType ?? "Checking"
      body.customer = {
        ...(input.saveCustomer ? { save: "Yes" } : {}),
        ...input.customer,
      }
    }
    return body
  }

  private async request<T = any>(
    url: string,
    method: "POST" | "GET",
    body?: unknown
  ): Promise<T> {
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.opts.apiToken}`,
        "Content-Type": "application/json",
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
    const text = await resp.text()
    const json = text ? JSON.parse(text) : {}
    if (!resp.ok) {
      const msg = (json as any)?.message ?? text
      throw new Error(`Kadima ACH HTTP ${resp.status}: ${msg}`)
    }
    return json as T
  }
}

export interface AchTxnInput {
  amount: number
  tax?: number
  secCode?: "PPD" | "CCD" | "WEB" | "TEL"
  memo?: string
  addendaText?: string
  // Either an existing vault customer ...
  customerId?: string | number
  accountId?: string | number
  // ... or a new inline bank account (top-level fields) + customer details.
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  accountType?: "Checking" | "Savings"
  saveCustomer?: boolean // customer.save = "Yes"
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address1?: string
    address2?: string
    city?: string
    state?: string
    zipCode?: string
    identifier?: string // merchant-side unique id for the payer
    sendReceipt?: "Yes" | "No"
  }
}

/** ACH transaction object (List/View/webhook achObject). */
export interface KadimaAchTxn {
  id: number | string
  amount: string
  tax?: string
  SECCode?: "PPD" | "CCD" | "WEB" | "TEL"
  accountName?: string
  accountNumber?: string
  accountType?: "Checking" | "Savings"
  routingNumber?: string
  transactionType?: "Debit" | "Credit"
  transactionStatus?: KadimaAchStatus
  dba?: { id: number; name?: string }
  customer?: { id?: string | null; identifier?: string | null; email?: string | null }
  verification?: { status?: string; date?: string | null }
  return?: { code?: string | null; date?: string | null }
  source?: string
  createdOn?: string
  updatedOn?: string
}

export type KadimaAchStatus =
  | "Voided"
  | "Hold"
  | "Pending"
  | "Submitted"
  | "Transmitted"
  | "Settled"
  | "Returned"
