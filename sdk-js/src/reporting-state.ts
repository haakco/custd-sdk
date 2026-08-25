import type { RenderedWidgetData, ReportingNextActionHint, ReportingQueryRequest } from "./index.js";

/**
 * The server can return data with more than one quality signal at once. Keep
 * the combined state explicit so callers do not infer it from colour or from
 * a missing chart.
 */
export type ReportingDataState = "empty" | "ready" | "stale" | "partial" | "stale_partial" | "unavailable";

export type ReportingQueryState<T> =
  | { status: "loading"; data?: T }
  | { status: "error"; error: unknown; data?: T }
  | { status: "success"; data: T };

export type ReportingViewState<T> =
  | {
      phase: "loading";
      data?: T;
      dataState?: ReportingDataState;
      retryable: boolean;
      nextAction: ReportingNextActionHint;
    }
  | {
      phase: "error";
      error: unknown;
      data?: T;
      dataState?: ReportingDataState;
      retryable: boolean;
      nextAction: ReportingNextActionHint;
    }
  | {
      phase: "success";
      data: T;
      dataState: ReportingDataState;
      retryable: boolean;
      nextAction: ReportingNextActionHint;
    };

const NO_ACTION: ReportingNextActionHint = { action: "none" };

export function classifyReportingData(data: RenderedWidgetData): ReportingDataState {
  const trust = data.trust;
  if (trust?.status === "unavailable" || trust?.dataFreshness === "unavailable") return "unavailable";
  if (data.buckets.length === 0 && data.value.sampleCount === 0) return "empty";

  const stale = trust?.dataFreshness === "stale";
  const partial =
    data.value.complete === false ||
    trust?.status === "partial" ||
    trust?.coverage === "partial" ||
    trust?.rollupState === "partial";
  if (stale && partial) return "stale_partial";
  if (partial) return "partial";
  if (stale) return "stale";
  return "ready";
}

export function getReportingViewState<T extends RenderedWidgetData>(
  query: ReportingQueryState<T>,
): ReportingViewState<T> {
  const data = query.data;
  const action = data?.trust?.nextAction ?? NO_ACTION;
  const retryable = data?.trust?.retryability === "bounded" || action.action === "retry" || action.action === "poll";

  if (query.status === "loading") {
    return {
      phase: "loading",
      data,
      dataState: data ? classifyReportingData(data) : undefined,
      retryable,
      nextAction: action,
    };
  }
  if (query.status === "error") {
    return {
      phase: "error",
      error: query.error,
      data,
      dataState: data ? classifyReportingData(data) : undefined,
      retryable,
      nextAction: action,
    };
  }
  const successData = query.data;
  return {
    phase: "success",
    data: successData,
    dataState: classifyReportingData(successData),
    retryable,
    nextAction: action,
  };
}

/**
 * Build a deterministic cache key from a server-owned reporting request. The
 * key contains no client-owned cache policy or response data, and filter order
 * does not cause duplicate entries.
 */
export function reportingQueryKey(request: ReportingQueryRequest): readonly [string, string, string] {
  const normalized = { ...request, filters: request.filters?.slice().sort(compareFilters) };
  return ["custd", "reporting", stableJson(normalized)];
}

function compareFilters(
  left: NonNullable<ReportingQueryRequest["filters"]>[number],
  right: NonNullable<ReportingQueryRequest["filters"]>[number],
): number {
  return `${left.dimension}\u0000${left.operator}\u0000${left.value ?? ""}`.localeCompare(
    `${right.dimension}\u0000${right.operator}\u0000${right.value ?? ""}`,
  );
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
