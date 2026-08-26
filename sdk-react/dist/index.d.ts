import { type RenderedWidgetData, type ReportingDataState, type ReportingViewState } from "@haakco/custd-sdk";
import { type QueryFunction, type QueryKey, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
export type CustdReportingViewState<TData extends RenderedWidgetData> = ReportingViewState<TData>;
export type CustdReportingDisplayState = "loading" | "error" | ReportingDataState;
export type CustdReportingQueryOptions<TData extends RenderedWidgetData, TError = unknown, TQueryKey extends QueryKey = QueryKey> = Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, "queryKey" | "queryFn"> & {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TData, TQueryKey>;
};
export type CustdReportingQueryResult<TData extends RenderedWidgetData, TError = unknown> = UseQueryResult<TData, TError> & {
    view: CustdReportingViewState<TData>;
};
export declare function getCustdReportingViewState<TData extends RenderedWidgetData, TError = unknown>(query: UseQueryResult<TData, TError>): CustdReportingViewState<TData>;
export declare function useCustdReportingViewState<TData extends RenderedWidgetData, TError = unknown>(query: UseQueryResult<TData, TError>): CustdReportingViewState<TData>;
export declare function useCustdReportingQuery<TData extends RenderedWidgetData, TError = unknown, TQueryKey extends QueryKey = QueryKey>(options: CustdReportingQueryOptions<TData, TError, TQueryKey>): CustdReportingQueryResult<TData, TError>;
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
export declare function getCustdReportingDisplayState<TData extends RenderedWidgetData>(view: CustdReportingViewState<TData>): CustdReportingDisplayState;
export declare function CustdReportingState<TData extends RenderedWidgetData>({ view, children, onRetry, retryLabel, labels, renderState, className, }: CustdReportingStateProps<TData>): import("react").JSX.Element;
