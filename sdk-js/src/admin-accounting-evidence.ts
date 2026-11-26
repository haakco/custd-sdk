/**
 * Accounting evidence: the purchases, balances and corrections a tenant records against a metered
 * quantity. A correction supersedes or targets an earlier record instead of editing it.
 */

import type { RequestOptions } from "./index.js";

export type AccountingEvidenceKind = "purchase" | "balance" | "correction";

/** UCUM unit codes the evidence quantities accept. */
export type AccountingEvidenceUnit = "W" | "kW" | "Wh" | "kWh" | "V" | "A" | "L" | "Cel" | "By" | "1";

type AccountingEvidenceFields = {
  id: string;
  kind: AccountingEvidenceKind;
  unit: AccountingEvidenceUnit;
  effectiveAt: string;
  observedAt: string;
  reason: string;
  auditCorrelationId: string;
  quantity?: number;
  balance?: number;
  delta?: number;
  supersedesId?: string;
  targetId?: string;
  targetKind?: AccountingEvidenceKind;
};

export type AccountingEvidenceCreateRequest = AccountingEvidenceFields;

/** One recorded evidence item, with the tenant and actor the server attributed it to. */
export type AccountingEvidence = AccountingEvidenceFields & { tenantKey: string; actor: string };

export type AccountingEvidenceListResponse = { evidence: AccountingEvidence[] };

export type AccountingEvidenceResponse = { evidence: AccountingEvidence };

/** `asOf` reads the evidence as it stood at an RFC3339 instant. */
export type AccountingEvidenceListQuery = { asOf?: string; limit?: number };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

const evidencePath = "/accounting/evidence";

export class AccountingEvidenceAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(
    query: AccountingEvidenceListQuery = {},
    options?: RequestOptions,
  ): Promise<AccountingEvidenceListResponse> {
    const params = new URLSearchParams();
    if (query.asOf !== undefined) params.set("asOf", query.asOf);
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    const encoded = params.toString();
    const path = encoded ? `${evidencePath}?${encoded}` : evidencePath;
    const list = await this.request<AccountingEvidenceListResponse>("GET", path, undefined, options);
    return { evidence: list.evidence ?? [] };
  }

  create(body: AccountingEvidenceCreateRequest, options?: RequestOptions): Promise<AccountingEvidenceResponse> {
    return this.request("POST", evidencePath, body, options);
  }
}
