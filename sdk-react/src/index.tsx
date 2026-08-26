import {
  getReportingViewState,
  type RenderedWidgetData,
  type ReportingDataState,
  type ReportingQueryState,
  type ReportingViewState,
} from "@haakco/custd-sdk";
import {
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

export type CustdReportingViewState<TData extends RenderedWidgetData> = ReportingViewState<TData>;

export type CustdReportingDisplayState = "loading" | "error" | ReportingDataState;

export type CustdReportingQueryOptions<
  TData extends RenderedWidgetData,
  TError = unknown,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, "queryKey" | "queryFn"> & {
  queryKey: TQueryKey;
  queryFn: QueryFunction<TData, TQueryKey>;
};

export type CustdReportingQueryResult<TData extends RenderedWidgetData, TError = unknown> = UseQueryResult<
  TData,
  TError
> & {
  view: CustdReportingViewState<TData>;
};

export function getCustdReportingViewState<TData extends RenderedWidgetData, TError = unknown>(
  query: UseQueryResult<TData, TError>,
): CustdReportingViewState<TData> {
  return getReportingViewState(toReportingQueryState(query));
}

export function useCustdReportingViewState<TData extends RenderedWidgetData, TError = unknown>(
  query: UseQueryResult<TData, TError>,
): CustdReportingViewState<TData> {
  return getCustdReportingViewState(query);
}

export function useCustdReportingQuery<
  TData extends RenderedWidgetData,
  TError = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(options: CustdReportingQueryOptions<TData, TError, TQueryKey>): CustdReportingQueryResult<TData, TError> {
  const query = useQuery(options);
  return { ...query, view: useCustdReportingViewState(query) };
}

export type CustdReportingLabels = Partial<Record<CustdReportingDisplayState, string>>;

export type CustdReportingStateProps<TData extends RenderedWidgetData> = {
  view: CustdReportingViewState<TData>;
  children?: ReactNode | ((data: TData) => ReactNode);
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  labels?: CustdReportingLabels;
  renderState?: (state: CustdReportingDisplayState, view: CustdReportingViewState<TData>) => ReactNode;
  className?: string;
};

const DEFAULT_LABELS: Record<CustdReportingDisplayState, string> = {
  loading: "Loading report…",
  error: "Report unavailable right now.",
  unavailable: "Reporting is unavailable.",
  empty: "No data for this period.",
  stale: "Showing older data.",
  partial: "Some report data is still being prepared.",
  stale_partial: "Showing older, incomplete data.",
  ready: "",
};

export function getCustdReportingDisplayState<TData extends RenderedWidgetData>(
  view: CustdReportingViewState<TData>,
): CustdReportingDisplayState {
  if (view.phase === "loading") return "loading";
  if (view.phase === "error") return "error";
  return view.dataState;
}

export function CustdReportingState<TData extends RenderedWidgetData>({
  view,
  children,
  onRetry,
  retryLabel = "Try again",
  labels,
  renderState,
  className,
}: CustdReportingStateProps<TData>) {
  const state = getCustdReportingDisplayState(view);
  const data = view.data;
  const message = renderState ? renderState(state, view) : (labels?.[state] ?? DEFAULT_LABELS[state]);
  const showData = data !== undefined && state !== "empty" && state !== "unavailable";
  const content = showData ? renderReportingContent(children, data) : null;
  const retry =
    view.retryable && onRetry ? (
      <button type="button" data-custd-reporting-action="retry" onClick={() => void onRetry()}>
        {retryLabel}
      </button>
    ) : null;
  const feedback =
    state === "ready" && message === "" && retry === null ? null : (
      <div
        role={state === "error" ? "alert" : "status"}
        aria-live={state === "error" ? "assertive" : "polite"}
        data-custd-reporting-feedback={state}
      >
        {typeof message === "string" ? message !== "" ? <p>{message}</p> : null : message}
        {retry}
      </div>
    );

  return (
    <div className={className} data-custd-reporting-state={state} aria-busy={state === "loading" ? true : undefined}>
      {feedback}
      {content}
    </div>
  );
}

function toReportingQueryState<TData extends RenderedWidgetData, TError>(
  query: UseQueryResult<TData, TError>,
): ReportingQueryState<TData> {
  if (query.status === "pending" || query.isFetching) {
    return { status: "loading", data: query.data };
  }
  if (query.status === "error") {
    return { status: "error", error: query.error, data: query.data };
  }
  return { status: "success", data: query.data };
}

function renderReportingContent<TData extends RenderedWidgetData>(
  children: CustdReportingStateProps<TData>["children"],
  data: TData,
): ReactNode {
  return typeof children === "function" ? children(data) : children;
}
