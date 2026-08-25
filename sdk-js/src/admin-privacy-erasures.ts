// PrivacyErasureClient owns per-tenant subject erasure requests. Erasures
// are forward-only. This client owns bounded polling and the single supported
// force-recovery attempt so product integrations do not recreate that workflow.

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
  status: string;
  state?: string;
  selectorType?: string;
  selectorDisplay?: string;
  perStoreProgress?: PrivacyErasureStoreProgress[];
  createdAt?: string;
  completedAt?: string;
};

export type PrivacyErasureCreateRequest = {
  companySlug: string;
  selector: PrivacyErasureSelector;
  reason: string;
  redactionId: string;
  forceNow?: boolean;
};

export type PrivacyErasureListResponse = {
  erasures: PrivacyErasure[];
};

export type PrivacyErasureState = {
  request?: PrivacyErasure;
  safe_next_action?: string;
  safe_next_action_code?: string;
};

export type PrivacyErasureWaitOptions = RequestOptions & {
  maxPolls?: number;
  pollIntervalMs?: number;
  onProgress?: (request: PrivacyErasure) => void;
};

export type PrivacyErasureRetryClassification = "retryable" | "non_retryable";

export class PrivacyErasureError extends Error {
  readonly retryable: boolean;

  constructor(
    readonly code: string,
    readonly retryClassification: PrivacyErasureRetryClassification,
    message: string,
  ) {
    super(message);
    this.name = "PrivacyErasureError";
    this.retryable = retryClassification === "retryable";
  }
}

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class PrivacyErasureClient {
  constructor(private readonly request: AdminRequester) {}

  create(body: PrivacyErasureCreateRequest, options?: RequestOptions): Promise<PrivacyErasure> {
    return this.request("POST", "/privacy/erasures", body, options);
  }

  list(options?: RequestOptions): Promise<PrivacyErasureListResponse> {
    return this.request("GET", "/privacy/erasures", undefined, options);
  }

  get(companySlug: string, requestUuid: string, options?: RequestOptions): Promise<PrivacyErasure> {
    return this.request(
      "GET",
      `/privacy/erasures/${encodeURIComponent(requestUuid)}?companySlug=${encodeURIComponent(companySlug)}`,
      undefined,
      options,
    );
  }

  force(companySlug: string, requestUuid: string, options?: RequestOptions): Promise<PrivacyErasureState> {
    return this.request(
      "POST",
      `/privacy/erasures/${encodeURIComponent(requestUuid)}/force?companySlug=${encodeURIComponent(companySlug)}`,
      undefined,
      options,
    );
  }

  async createAndWait(
    body: PrivacyErasureCreateRequest,
    options: PrivacyErasureWaitOptions = {},
  ): Promise<PrivacyErasure> {
    const created = await this.create(body, options);
    options.onProgress?.(created);
    return this.waitForCompletion(body.companySlug, created.requestUuid, { ...options, initialRequest: created });
  }

  async waitForCompletion(
    companySlug: string,
    requestUuid: string,
    options: PrivacyErasureWaitOptions & { initialRequest?: PrivacyErasure } = {},
  ): Promise<PrivacyErasure> {
    const maxPolls = options.maxPolls ?? 60;
    const pollIntervalMs = options.pollIntervalMs ?? 1_000;
    let current = options.initialRequest;
    let forced = false;
    for (let poll = 0; poll < maxPolls; poll += 1) {
      if (!current || poll > 0 || options.initialRequest) {
        if (pollIntervalMs > 0) await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        current = await this.get(companySlug, requestUuid, options);
        options.onProgress?.(current);
      }
      if (current.status === "s3_reflected") return current;
      if (current.status === "failed" && !forced) {
        const recovery = await this.force(companySlug, requestUuid, options);
        forced = true;
        if (recovery.safe_next_action) {
          throw new PrivacyErasureError(
            "force_recovery_blocked",
            "non_retryable",
            `Custd privacy erasure recovery blocked (${recovery.safe_next_action_code || "unknown"})`,
          );
        }
        current = recovery.request;
      }
    }
    throw new PrivacyErasureError(
      "poll_timeout",
      "retryable",
      "Custd privacy erasure did not complete within the polling limit",
    );
  }
}
