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
export type ErrorIssueListResponse = {
    issues: ErrorIssue[];
    openCount: number;
    nextCursor?: string;
};
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
export type ErrorIssueDetail = {
    companyName?: string;
    issue: ErrorIssue;
    latestEventUuid: string;
    latestEvent: ErrorIssueEvent;
};
export type ErrorIssueStateRequest = {
    state: ErrorIssueState;
};
export declare class ErrorIssueAdminClient {
    private readonly request;
    constructor(request: NonAdminRequester);
    list(query?: ErrorIssueListQuery): Promise<ErrorIssueListResponse>;
    get(issueUuid: string, companySlug?: string): Promise<ErrorIssueDetail>;
    setState(issueUuid: string, state: ErrorIssueState, companySlug?: string): Promise<ErrorIssue>;
}
export {};
