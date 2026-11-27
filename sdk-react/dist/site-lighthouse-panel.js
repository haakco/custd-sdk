import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MonitoringMetrics, MonitoringSection } from "./monitoring-section.js";
const profiles = ["desktop", "mobile"];
const scoreLabels = {
    performance: "Performance",
    accessibility: "Accessibility",
    bestPractices: "Best practices",
    seo: "SEO",
};
const scores = Object.keys(scoreLabels);
export function SiteLighthousePanel({ history, className, style, labels, formatTime = (value) => value, formatScore = String, }) {
    return (_jsx(MonitoringSection, { part: "lighthouse-panel", title: labels?.title ?? "Lighthouse scores", className: className, style: style, children: profiles.map((profile) => {
            const run = history.runs
                .filter((run) => run.profile === profile)
                .reduce((latest, current) => !latest || Date.parse(current.observedAt) > Date.parse(latest.observedAt) ? current : latest, undefined);
            return (_jsxs("div", { "data-custd-part": "lighthouse-profile", "data-profile": profile, children: [_jsx("h3", { children: labels?.[profile] ?? (profile === "desktop" ? "Desktop" : "Mobile") }), run && _jsx("time", { dateTime: run.observedAt, children: formatTime(run.observedAt) }), !run && _jsx("p", { children: labels?.empty ?? "No runs yet." }), run?.outcome === "failed" && _jsx("p", { children: labels?.failed ?? "The latest run failed." }), run?.outcome === "success" && (_jsx(MonitoringMetrics, { part: "lighthouse-scores", children: scores.map((key) => {
                            const score = run.scores[key];
                            return (_jsxs("div", { "data-score": key, children: [_jsx("dt", { children: labels?.[key] ?? scoreLabels[key] }), _jsx("dd", { children: score === undefined ? (labels?.unavailable ?? "Unavailable") : formatScore(score) })] }, key));
                        }) }))] }, profile));
        }) }));
}
