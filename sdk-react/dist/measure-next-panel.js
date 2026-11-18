import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatModelNumber } from "./model-shorthand.js";
const DEFAULT_LABELS = {
    title: "What to measure next",
    noDecision: "Set a decision (a threshold on an output) to see which input is worth measuring first.",
    recommendation: (recommended, chance) => recommended === "act" ? `Act now: ${chance} chance acting pays.` : `Hold: only ${chance} chance acting pays.`,
    decision: (output, threshold) => `Deciding on ${output} against ${threshold}.`,
    suggested: (input) => `Measure ${input} next.`,
    nothingWorthwhile: "No single measurement is worth its cost now: decide with what you know.",
    certaintyWorth: (value) => `Knowing everything exactly would be worth ${value}.`,
    inputWorth: (value) => `worth ${value} to know exactly`,
};
/** The decision's recommendation and the inputs ranked by what knowing each exactly is worth. */
export function MeasureNextPanel({ information, decision, formatValue = formatModelNumber, labels: overrides, className, style, }) {
    const labels = { ...DEFAULT_LABELS, ...overrides };
    if (!information) {
        return (_jsxs("section", { className: className, style: style, "data-custd-measure-next": "none", children: [_jsx("h3", { children: labels.title }), _jsx("p", { children: labels.noDecision })] }));
    }
    const ranked = [...(information.inputs ?? [])].sort((left, right) => right.expectedValueOfPerfectInformation - left.expectedValueOfPerfectInformation);
    const suggested = information.suggestedNextMeasurement;
    const chance = `${Math.round(information.actProbability * 100)}%`;
    return (_jsxs("section", { className: className, style: style, "data-custd-measure-next": suggested || "nothing", children: [_jsx("h3", { children: labels.title }), decision ? _jsx("p", { children: labels.decision(decision.output, formatValue(decision.threshold)) }) : null, _jsx("p", { children: labels.recommendation(information.recommended, chance) }), _jsx("p", { children: _jsx("strong", { children: suggested ? labels.suggested(suggested) : labels.nothingWorthwhile }) }), _jsx("p", { children: labels.certaintyWorth(formatValue(information.expectedValueOfPerfectInformation)) }), ranked.length > 0 ? (_jsx("ol", { children: ranked.map((input) => (_jsxs("li", { "aria-current": input.name === suggested ? "true" : undefined, children: [input.name, ": ", labels.inputWorth(formatValue(input.expectedValueOfPerfectInformation))] }, input.name))) })) : null] }));
}
