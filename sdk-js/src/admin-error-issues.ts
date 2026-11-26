/**
 * Grouped error issues captured from a tenant's apps: list, read with the latest event, and set state.
 */

import type { RequestOptions } from "./index.js";

type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export type ErrorIssueState = "open" | "resolved" | "ignored";

export type ErrorIssueListState = ErrorIssueState | "all";

export type ErrorIssueSort = "recent" | "frequent";

export type ErrorIssue = {
  uuid: string;
  siteUuid: string;
  siteName: string;
  fingerprint: string;
  title: string;
  exceptionType: string;
  culprit: string;
  platform: string;
  state: ErrorIssueState;
  eventCount: number;
  environments: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  firstRelease: string;
  lastRelease: string;
  regressedAt?: string;
  resolvedAt?: string;
  resolvedRelease?: string;
};

export type ErrorIssueListQuery = {
  companySlug?: string;
  siteUuid?: string;
  state?: ErrorIssueListState;
  sort?: ErrorIssueSort;
  limit?: number;
  cursor?: string;
};

export type ErrorIssueListResponse = { issues: ErrorIssue[]; openCount: number; nextCursor?: string };

export type ErrorIssueFrame = {
  filename?: string;
  function?: string;
  module?: string;
  line?: number;
  column?: number;
  inApp?: boolean;
  contextLine?: string;
  preContext: string[];
  postContext: string[];
};

export type ErrorIssueException = {
  type: string;
  value?: string;
  module?: string;
  handled?: boolean;
  frames: ErrorIssueFrame[];
  framesOmitted?: number;
};

export type ErrorIssueEvent = {
  fingerprint: string;
  exceptions: ErrorIssueException[];
  level?: string;
  platform?: string;
  release?: string;
  environment?: string;
  siteUuid?: string;
  correlationId?: string;
  runtimeName?: string;
  runtimeVersion?: string;
  sdkName?: string;
  sdkVersion?: string;
  truncated?: boolean;
};

export type ErrorIssueDetail = { issue: ErrorIssue; latestEventUuid: string; latestEvent: ErrorIssueEvent };

export type ErrorIssueStateRequest = { state: ErrorIssueState };

type Wire<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] | null };
type WireFrame = Wire<ErrorIssueFrame, "preContext" | "postContext">;
type WireException = Omit<ErrorIssueException, "frames"> & { frames?: WireFrame[] | null };
type WireEvent = Omit<ErrorIssueEvent, "exceptions"> & { exceptions: WireException[] | null };
type WireIssue = Wire<ErrorIssue, "environments">;

export class ErrorIssueAdminClient {
  constructor(private readonly request: NonAdminRequester) {}

  async list(query: ErrorIssueListQuery = {}): Promise<ErrorIssueListResponse> {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(name, String(value));
    }
    const search = params.toString();
    const response = await this.request<Omit<ErrorIssueListResponse, "issues"> & { issues: WireIssue[] | null }>(
      "GET",
      search ? `/error-issues?${search}` : "/error-issues",
    );
    return { ...response, issues: (response.issues ?? []).map(issue) };
  }

  async get(issueUuid: string, companySlug?: string): Promise<ErrorIssueDetail> {
    const detail = await this.request<{ issue: WireIssue; latestEventUuid: string; latestEvent: WireEvent }>(
      "GET",
      scoped(issuePath(issueUuid), companySlug),
    );
    return {
      issue: issue(detail.issue),
      latestEventUuid: detail.latestEventUuid,
      latestEvent: event(detail.latestEvent),
    };
  }

  async setState(issueUuid: string, state: ErrorIssueState, companySlug?: string): Promise<ErrorIssue> {
    const body: ErrorIssueStateRequest = { state };
    return issue(await this.request<WireIssue>("POST", scoped(`${issuePath(issueUuid)}/state`, companySlug), body));
  }
}

function issue(wire: WireIssue): ErrorIssue {
  return { ...wire, environments: wire.environments ?? [] };
}

function event(wire: WireEvent): ErrorIssueEvent {
  return {
    ...wire,
    exceptions: (wire.exceptions ?? []).map((exception) => ({
      ...exception,
      frames: (exception.frames ?? []).map((frame) => ({
        ...frame,
        preContext: frame.preContext ?? [],
        postContext: frame.postContext ?? [],
      })),
    })),
  };
}

function issuePath(issueUuid: string): string {
  return `/error-issues/${encodeURIComponent(issueUuid)}`;
}

function scoped(path: string, companySlug?: string): string {
  return companySlug ? `${path}?companySlug=${encodeURIComponent(companySlug)}` : path;
}
