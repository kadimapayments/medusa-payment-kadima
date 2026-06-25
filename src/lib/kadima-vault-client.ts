import { DASHBOARD_HOSTS, KadimaCardOptions } from "../types"

/**
 * Client over the Kadima card CustomerVault (kadimadashboard.com/api/customer-vault).
 * This is the CARD vault — distinct from the ACH vault (/api/ach/customer).
 *
 * Verified against Kadima_Dashboard_API_COMPLETE.md:
 *   POST   /api/customer-vault                         create customer (returns { id, token })
 *   GET    /api/customer-vault/<id>                     view customer
 *   PUT    /api/customer-vault/<id>                     update customer
 *   DELETE /api/customer-vault/<id>                     delete customer
 *   GET    /api/customer-vault/<id>/cards               list cards
 *   POST   /api/customer-vault/<id>/card                add card (raw PAN — PCI scoped)
 *   GET    /api/customer-vault/<id>/card/<cardId>       view card
 *   DELETE /api/customer-vault/<id>/card/<cardId>       delete card
 *
 * NOTE the vault customer's merchant-side id field is `identificator` (different
 * from the ACH customer's `identifier`).
 */
export class KadimaVaultClient {
  private readonly base: string

  constructor(private readonly opts: KadimaCardOptions) {
    const host = opts.sandbox ? DASHBOARD_HOSTS.sandbox : DASHBOARD_HOSTS.prod
    this.base = `${host}/api/customer-vault`
  }

  // Customer requires dba.id. Returns the customer record incl. a vault `token`.
  async createCustomer(input: VaultCustomerInput): Promise<VaultCustomer> {
    if (this.opts.dbaId == null) {
      throw new Error("KadimaVaultClient: dbaId is required for CustomerVault")
    }
    return this.request("POST", this.base, {
      dba: { id: this.opts.dbaId },
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.company ? { company: input.company } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.identificator ? { identificator: input.identificator } : {}),
      ...(input.description ? { description: input.description } : {}),
    })
  }

  async getCustomer(id: string | number): Promise<VaultCustomer> {
    return this.request("GET", `${this.base}/${id}`)
  }

  async updateCustomer(
    id: string | number,
    patch: Partial<VaultCustomerInput>
  ): Promise<VaultCustomer> {
    return this.request("PUT", `${this.base}/${id}`, patch)
  }

  async deleteCustomer(id: string | number): Promise<unknown> {
    return this.request("DELETE", `${this.base}/${id}`)
  }

  // Billing records — a card must reference a billing.id, so create one first.
  async createBilling(
    customerId: string | number,
    billing: VaultBillingInput
  ): Promise<VaultBilling> {
    return this.request("POST", `${this.base}/${customerId}/billing-information`, billing)
  }
  async listBilling(customerId: string | number): Promise<{ items: VaultBilling[] }> {
    return this.request("GET", `${this.base}/${customerId}/billing-information`)
  }

  async listCards(customerId: string | number): Promise<{ items: VaultCard[] }> {
    return this.request("GET", `${this.base}/${customerId}/cards`)
  }

  // Add a card with raw PAN (PCI-scoped path). exp is mm/yy.
  async addCard(customerId: string | number, card: AddCardInput): Promise<VaultCard> {
    return this.request("POST", `${this.base}/${customerId}/card`, {
      terminal: { id: this.opts.terminalId },
      number: card.number,
      exp: card.exp,
      cvv: card.cvv,
      holderName: card.holderName,
      ...(card.billingId != null ? { billing: { id: card.billingId } } : {}),
    })
  }

  async deleteCard(customerId: string | number, cardId: string | number): Promise<unknown> {
    return this.request("DELETE", `${this.base}/${customerId}/card/${cardId}`)
  }

  private async request<T = any>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
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
      throw new Error(`Kadima Vault HTTP ${resp.status}: ${msg}`)
    }
    return json as T
  }
}

export interface VaultCustomerInput {
  firstName?: string
  lastName?: string
  company?: string
  email?: string
  phone?: string
  identificator?: string // merchant-side customer id (note: NOT "identifier")
  description?: string
}

export interface VaultCustomer extends VaultCustomerInput {
  id: number | string
  token: string
  dba?: { id: number | string }
  archived?: unknown
  createdOn?: string | null
  updatedOn?: string | null
}

export interface VaultBillingInput {
  firstName: string
  lastName: string
  address: string
  city: string
  country: string // e.g. "US"
  zip: string
  state?: string
}

export interface VaultBilling extends VaultBillingInput {
  id: number | string
}

export interface AddCardInput {
  number: string | number
  exp: string // mm/yy
  cvv: string | number
  holderName: string
  billingId?: number | string
}

export interface VaultCard {
  id: number | string
  number: number // last 4
  bin?: Record<string, any>
  exp: string
  token: string // use as card.token for future charges
  order?: number
  lastUsedOn?: string | null
}
