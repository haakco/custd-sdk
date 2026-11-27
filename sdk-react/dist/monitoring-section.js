import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from "react";
export function MonitoringSection({ part, title, className, style, children }) {
    const titleId = useId();
    return (_jsxs("section", { className: className, style: style, "aria-labelledby": titleId, "data-custd-monitoring": "", "data-custd-part": part, children: [_jsx("h2", { id: titleId, children: title }), children] }));
}
export function MonitoringMetrics({ part, children, }) {
    return (_jsx("dl", { "data-custd-metrics": "", "data-custd-part": part, children: children }));
}
