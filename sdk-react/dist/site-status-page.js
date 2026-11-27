import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MonitoringSection } from "./monitoring-section.js";
const defaultStatusLabels = {
    up: "Operational",
    down: "Outage",
    failing: "Degraded",
    maintenance: "Maintenance",
    paused: "Monitoring paused",
    unknown: "Status unknown",
};
// Public status data omits internal IDs and allows duplicate public labels.
function labelledKeys(values, labelOf) {
    const counts = new Map();
    return values.map((value) => {
        const label = labelOf(value);
        const count = (counts.get(label) ?? 0) + 1;
        counts.set(label, count);
        return { value, key: JSON.stringify([label, count]) };
    });
}
export function SiteStatusPageView({ page, className, style, labels, statusLabels, formatTime = (value) => value, }) {
    return (_jsxs(MonitoringSection, { part: "status-page", title: page.title, className: className, style: style, children: [_jsx("h3", { children: labels?.components ?? "Components" }), page.components.length === 0 ? (_jsx("p", { children: labels?.noComponents ?? "No components listed." })) : (_jsx("ul", { "data-custd-part": "status-components", children: labelledKeys(page.components, (component) => component.label).map(({ value: component, key }) => (_jsxs("li", { "data-custd-part": "status-component", "data-state": component.status, children: [_jsx("span", { children: component.label }), " ", _jsx("strong", { children: statusLabels?.[component.status] ?? defaultStatusLabels[component.status] }), component.lastCheckedAt && (_jsxs(_Fragment, { children: [" ", _jsx("time", { dateTime: component.lastCheckedAt, children: formatTime(component.lastCheckedAt) })] }))] }, key))) })), _jsx("h3", { children: labels?.updates ?? "Updates" }), page.updates.length === 0 ? (_jsx("p", { children: labels?.noUpdates ?? "No updates published." })) : (_jsx("ul", { "data-custd-part": "status-updates", children: labelledKeys(page.updates, (update) => update.publishedAt).map(({ value: update, key }) => (_jsxs("li", { "data-custd-part": "status-update", children: [_jsx("time", { dateTime: update.publishedAt, children: formatTime(update.publishedAt) }), _jsx("p", { children: update.message })] }, key))) }))] }));
}
