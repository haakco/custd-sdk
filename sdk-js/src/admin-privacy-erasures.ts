// PrivacyErasureClient owns per-tenant subject erasure requests. Erasures
// are forward-only: there is no cancel or retry surface because the server
// contract has none. force is the bounded operator action.

import type { RequestOptions } from "./index.js";

// PrivacyErasureSelector is the typed selector the SDK submits to identify
// a subject. The value is a server-side identifier; the SDK must not log it.
export type PrivacyErasureSelector = {
  type: string;
  value: string;
};

// PrivacyErasureStoreProgress tracks per-store progress of an erasure.
// state == "retained" is terminal for the legal_hold store and means the
// row must not be deleted; callers must surface this verbatim.
export type PrivacyErasureStoreProgress = {
  store: string;
  state: string;
  deletedCount?: number;
  reason?: string;
};

export type PrivacyErasure = {
  requestUuid: string;
  tenantSlug: string;
  selector: PrivacyErasureSelector;
  state: string;
  perStoreProgress?: PrivacyErasureStoreProgress[];
  createdAt?: string;
  completedAt?: string;
};

export type PrivacyErasureCreateRequest = {
  tenantSlug: string;
  selector: PrivacyErasureSelector;
  reason: string;
};

export type PrivacyErasureListResponse = {
  erasures: PrivacyErasure[];
};

export type PrivacyErasureState = {
  requestUuid: string;
  state: string;
  forcedAt?: string;
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class PrivacyErasureClient {
  constructor(private readonly request: AdminRequester) {}

  create(body: PrivacyErasureCreateRequest, options?: RequestOptions): Promise<PrivacyErasure> {
    return this.request("POST", "/privacy/erasures", body, options);
  }

  list(options?: RequestOptions): Promise<PrivacyErasureListResponse> {
    return this.request("GET", "/privacy/erasures", undefined, options);
  }

  get(requestUuid: string, options?: RequestOptions): Promise<PrivacyErasure> {
    return this.request("GET", `/privacy/erasures/${encodeURIComponent(requestUuid)}`, undefined, options);
  }

  force(requestUuid: string, options?: RequestOptions): Promise<PrivacyErasureState> {
    return this.request("POST", `/privacy/erasures/${encodeURIComponent(requestUuid)}/force`, undefined, options);
  }
}
