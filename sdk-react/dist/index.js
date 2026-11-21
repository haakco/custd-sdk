import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getReportingViewState, } from "@haakco/custd-sdk";
import { useQuery, } from "@tanstack/react-query";
export function getCustdReportingViewState(query) {
    return getReportingViewState(toReportingQueryState(query));
}
export function useCustdReportingViewState(query) {
    return getCustdReportingViewState(query);
}
export function useCustdReportingQuery(options) {
    const query = useQuery(options);
    return { ...query, view: useCustdReportingViewState(query) };
}
const DEFAULT_LABELS = {
    loading: "Loading report…",
    error: "Report unavailable right now.",
    unavailable: "Reporting is unavailable.",
    empty: "No data for this period.",
    stale: "Showing older data.",
    partial: "Some report data is still being prepared.",
    stale_partial: "Showing older, incomplete data.",
    ready: "",
};
export function getCustdReportingDisplayState(view) {
    if (view.phase === "loading")
        return "loading";
    if (view.phase === "error")
        return "error";
    return view.dataState;
}
export function CustdReportingState({ view, children, onRetry, retryLabel = "Try again", labels, renderState, className, }) {
    const state = getCustdReportingDisplayState(view);
    const data = view.data;
    const message = renderState ? renderState(state, view) : (labels?.[state] ?? DEFAULT_LABELS[state]);
    const showData = data !== undefined && state !== "empty" && state !== "unavailable";
    const content = showData ? renderReportingContent(children, data) : null;
    const retry = view.retryable && onRetry ? (_jsx("button", { type: "button", "data-custd-reporting-action": "retry", onClick: () => void onRetry(), children: retryLabel })) : null;
    const feedback = state === "ready" && message === "" && retry === null ? null : (_jsxs("div", { role: state === "error" ? "alert" : "status", "aria-live": state === "error" ? "assertive" : "polite", "data-custd-reporting-feedback": state, children: [typeof message === "string" ? message !== "" ? _jsx("p", { children: message }) : null : message, retry] }));
    return (_jsxs("div", { className: className, "data-custd-reporting-state": state, "aria-busy": state === "loading" ? true : undefined, children: [feedback, content] }));
}
function toReportingQueryState(query) {
    if (query.status === "pending" || query.isFetching) {
        return { status: "loading", data: query.data };
    }
    if (query.status === "error") {
        return { status: "error", error: query.error, data: query.data };
    }
    return { status: "success", data: query.data };
}
function renderReportingContent(children, data) {
    return typeof children === "function" ? children(data) : children;
}
export { CUSTD_APP_LIVE_IDLE, useAppForecast, useAppForecastStory, useAppItem, useAppMeeting, useAppModelRun, } from "./app-items.js";
export { ArrivalHistogram, } from "./arrival-histogram.js";
export { ConvergenceStory } from "./convergence-story.js";
export { ForecastChart } from "./forecast-chart.js";
export { CUSTD_HOSTED_APP_LOADING, CustdHostedAppProvider, useCustdHostedApp, } from "./hosted-app.js";
export { MeasureNextPanel, } from "./measure-next-panel.js";
export { ModelCalculator, } from "./model-calculator.js";
export { downloadSummaryCsv } from "./model-csv.js";
export { ModelEditor } from "./model-editor.js";
export { formatModelNumber, formatModelValue, parseModelValue, } from "./model-shorthand.js";
export { QuantityHistogram, } from "./quantity-histogram.js";
export { SafeMarkdown } from "./safe-markdown.js";
export { rankSensitivityInputs, SensitivityView, } from "./sensitivity-view.js";
export { CustdSessionProvider, useCustdSession } from "./session.js";
