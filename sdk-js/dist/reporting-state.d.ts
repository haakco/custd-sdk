import type { RenderedWidgetData, ReportingNextActionHint, ReportingQueryRequest } from "./index.js";
/**
 * The server can return data with more than one quality signal at once. Keep
 * the combined state explicit so callers do not infer it from colour or from
 * a missing chart.
 */
export type ReportingDataState = "empty" | "ready" | "stale" | "partial" | "stale_partial" | "unavailable";
export type ReportingQueryState<T> = {
    status: "loading";
    data?: T;
} | {
    status: "error";
    error: unknown;
    data?: T;
} | {
    status: "success";
    data: T;
};
export type ReportingViewState<T> = {
    phase: "loading";
    data?: T;
    dataState?: ReportingDataState;
    retryable: boolean;
    nextAction: ReportingNextActionHint;
} | {
    phase: "error";
    error: unknown;
    data?: T;
    dataState?: ReportingDataState;
    retryable: boolean;
    nextAction: ReportingNextActionHint;
} | {
    phase: "success";
    data: T;
    dataState: ReportingDataState;
    retryable: boolean;
    nextAction: ReportingNextActionHint;
};
export declare function classifyReportingData(data: RenderedWidgetData): ReportingDataState;
export declare function getReportingViewState<T extends RenderedWidgetData>(query: ReportingQueryState<T>): ReportingViewState<T>;
/**
 * Build a deterministic cache key from a server-owned reporting request. The
 * key contains no client-owned cache policy or response data, and filter order
 * does not cause duplicate entries.
 */
export declare function reportingQueryKey(request: ReportingQueryRequest): readonly [string, string, string];
