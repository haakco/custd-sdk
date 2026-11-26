// PrivacyErasureClient owns per-tenant subject erasure requests. Erasures
// are forward-only. This client owns bounded polling and the single supported
// force-recovery attempt so product integrations do not recreate that workflow.

import type { RequestOptions } from "./index.js";

// PrivacyErasureSelector identifies the subject: one value or a list of
// values. The values are server-side identifiers; the SDK must not log them.
export type PrivacyErasureSelector = {
  type: string;
  value?: string;
  values?: string[];
};

// PrivacyErasure is the read model of one erasure request: its status plus
// the rewrite, SLA and archive-propagation rollups.
export type PrivacyErasure = {
  requestUuid: string;
  status: string;
  selectorType: string;
  selectorDisplay: string;
  source?: string;
  requestedBy?: string;
  matchedEventCount: number;
  redactedEventCount: number;
  affectedSegmentCount: number;
  rewriteCount?: number;
  pendingRewriteCount?: number;
  rewritingRewriteCount?: number;
  rewrittenRewriteCount?: number;
  recompactedRewriteCount?: number;
  failedRewriteCount?: number;
  oldestPendingRewriteAt?: string;
  latestRecompactedAt?: string;
  archiveRecompactedAt?: string;
  s3PropagationLagSeconds?: number;
  latestFailureReason?: string;
  slaDeadlineAt?: string;
  slaState?: string;
  forceRequestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PrivacyErasureCreateRequest = {
  companySlug: string;
  selector: PrivacyErasureSelector;
  reason: string;
  redactionId: string;
  forceNow?: boolean;
};

export type PrivacyErasureListResponse = {
  requests: PrivacyErasure[];
};

export type PrivacyErasureState = {
  request?: PrivacyErasure;
  safe_next_action?: string;
  safe_next_action_code?: string;
};

export type PrivacyErasureWaitOptions = RequestOptions & {
  maxPolls?: number;
  pollIntervalMs?: number;
  onProgress?: (request: PrivacyErasure) => void | Promise<void>;
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
    return classifiedRequest(() => this.request("POST", "/privacy/erasures", body, options), "create_request_failed");
  }

  async list(companySlug: string, options?: RequestOptions): Promise<PrivacyErasureListResponse> {
    const list = await classifiedRequest(
      () =>
        this.request<PrivacyErasureListResponse>(
          "GET",
          `/privacy/erasures?companySlug=${encodeURIComponent(companySlug)}`,
          undefined,
          options,
        ),
      "list_request_failed",
    );
    return { requests: list.requests ?? [] };
  }

  get(companySlug: string, requestUuid: string, options?: RequestOptions): Promise<PrivacyErasure> {
    return classifiedRequest(
      () =>
        this.request(
          "GET",
          `/privacy/erasures/${encodeURIComponent(requestUuid)}?companySlug=${encodeURIComponent(companySlug)}`,
          undefined,
          options,
        ),
      "get_request_failed",
    );
  }

  force(companySlug: string, requestUuid: string, options?: RequestOptions): Promise<PrivacyErasureState> {
    return classifiedRequest(
      () =>
        this.request(
          "POST",
          `/privacy/erasures/${encodeURIComponent(requestUuid)}/force?companySlug=${encodeURIComponent(companySlug)}`,
          undefined,
          options,
        ),
      "force_request_failed",
    );
  }

  async createAndWait(
    body: PrivacyErasureCreateRequest,
    options: PrivacyErasureWaitOptions = {},
  ): Promise<PrivacyErasure> {
    const created = await this.create(body, options);
    await options.onProgress?.(created);
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
        await options.onProgress?.(current);
      }
      if (current.status === "s3_reflected") return current;
      if (current.status === "failed" && !forced) {
        const recovery = await this.force(companySlug, requestUuid, options);
        forced = true;
        if (recovery.safe_next_action) {
          const retryable = recovery.safe_next_action === "retry";
          throw new PrivacyErasureError(
            retryable ? "force_recovery_retry" : "force_recovery_blocked",
            retryable ? "retryable" : "non_retryable",
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

async function classifiedRequest<T>(request: () => Promise<T>, code: string): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof PrivacyErasureError) throw error;
    const status = (error as { problem?: { status?: unknown } })?.problem?.status;
    const retryable = typeof status !== "number" || status === 429 || status >= 500;
    throw new PrivacyErasureError(
      code,
      retryable ? "retryable" : "non_retryable",
      `Custd privacy erasure request failed${typeof status === "number" ? ` (HTTP ${status})` : ""}`,
    );
  }
}
