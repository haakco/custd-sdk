import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_MODEL_ERROR_CODES, APP_MODEL_INPUT_SHAPES, APP_MODEL_QUANTITY_KINDS, AppItemError, HOSTED_APP_STATUSES, } from "@haakco/custd-sdk/browser";
import { useId, useState } from "react";
import { useOptionalCustdHostedApp } from "./hosted-app.js";
import { formatModelNumber, formatModelValue, parseModelValue, rangeDistributionOf } from "./model-shorthand.js";
const DEFAULT_LABELS = {
    inputs: "Try values",
    outputs: "Results",
    calculate: "Calculate",
    calculating: "Calculating…",
    unavailable: "Calculating with other values is not available here yet.",
    failed: "The calculation did not run.",
    limited: "Too many calculations just now. Try again in a minute.",
    queuedRunFailed: ({ error, attempts, failedAt }) => `Live inputs changed but the new run failed after ${attempts} ${attempts === 1 ? "try" : "tries"} (last ${new Date(failedAt).toLocaleString()}): ${error}. These results are older.`,
    notCalculated: "not calculated",
    formulaRefused: "A calculator takes a value, a range or k of n, not a formula.",
    output: (mean, low, high) => `${mean} (90%: ${low} to ${high})`,
};
/** A form over chosen inputs and outputs of a saved version. Calculating never changes the model. */
export function ModelCalculator({ version, inputs, outputs, baseline, calculate: given, access, client, labels: overrides, className, style, }) {
    const labels = { ...DEFAULT_LABELS, ...overrides };
    const hosted = useOptionalCustdHostedApp();
    const runner = client ?? (hosted?.status === HOSTED_APP_STATUSES.ready ? hosted.app.appItems : undefined);
    const calculate = given ??
        (runner && access ? (request) => runner.calculateModel(access, request) : undefined);
    const formId = useId();
    const [fields, setFields] = useState(() => calculatorFields(version.quantities, inputs));
    const [errors, setErrors] = useState({});
    const [result, setResult] = useState();
    const [state, setState] = useState("idle");
    const shown = result ?? baseline;
    const submit = async (event) => {
        event.preventDefault();
        if (!calculate)
            return;
        const checked = checkFields(fields, labels);
        setErrors(checked.errors);
        if (!checked.inputs)
            return;
        setState("running");
        try {
            setResult(await calculate({ versionNumber: version.versionNumber, inputs: checked.inputs, outputs }));
            setState("idle");
        }
        catch (error) {
            const limited = error instanceof AppItemError && error.code === APP_MODEL_ERROR_CODES.calculateLimited;
            setState(limited ? "limited" : "failed");
        }
    };
    return (_jsxs("form", { className: className, style: style, onSubmit: submit, noValidate: true, "data-custd-model-calculator": "", children: [_jsxs("fieldset", { children: [_jsx("legend", { children: labels.inputs }), fields.map((field, index) => {
                        const id = `${formId}-${field.quantity.name}`;
                        const error = errors[field.quantity.name];
                        return (_jsxs("div", { style: { display: "grid" }, children: [_jsxs("label", { htmlFor: id, children: [field.quantity.name, field.quantity.unit ? ` (${field.quantity.unit})` : ""] }), _jsx("input", { id: id, value: field.text, readOnly: !calculate, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined, onChange: (event) => setFields((current) => current.map((other, at) => (at === index ? { ...other, text: event.target.value } : other))) }), error ? _jsx("span", { id: `${id}-error`, children: error }) : null] }, field.quantity.name));
                    })] }), calculate ? (_jsx("button", { type: "submit", disabled: state === "running", children: state === "running" ? labels.calculating : labels.calculate })) : (_jsx("p", { children: labels.unavailable })), state === "failed" || state === "limited" ? _jsx("p", { role: "alert", children: labels[state] }) : null, !result && baseline?.queuedRunFailure ? (_jsx("p", { role: "status", children: labels.queuedRunFailed(baseline.queuedRunFailure) })) : null, _jsx("section", { "aria-live": "polite", "aria-label": labels.outputs, children: _jsx("dl", { children: outputs.map((name) => (_jsx(OutputRow, { name: name, result: shown, labels: labels, version: version }, name))) }) })] }));
}
function OutputRow({ name, result, labels, version, }) {
    const quantity = result?.quantities?.find((candidate) => candidate.name === name);
    const unit = version.quantities.find((candidate) => candidate.name === name)?.unit;
    const show = (value) => (unit ? `${formatModelNumber(value)} ${unit}` : formatModelNumber(value));
    const summary = quantity?.summary;
    return (_jsxs("div", { "data-custd-calculator-output": name, children: [_jsx("dt", { children: name }), _jsx("dd", { children: summary
                    ? labels.output(show(summary.mean), show(summary.percentiles.p5), show(summary.percentiles.p95))
                    : (quantity?.error?.detail ?? labels.notCalculated) })] }));
}
function calculatorFields(quantities, names) {
    const fields = [];
    for (const name of names) {
        const quantity = quantities.find((candidate) => candidate.name === name);
        if (quantity?.kind !== APP_MODEL_QUANTITY_KINDS.input || quantity.input.shape === APP_MODEL_INPUT_SHAPES.bound) {
            continue;
        }
        fields.push({ quantity, text: formatModelValue(quantity) });
    }
    return fields;
}
function checkFields(fields, labels) {
    const errors = {};
    const inputs = [];
    for (const field of fields) {
        const parsed = parseModelValue(field.text, rangeDistributionOf(field.quantity));
        if (!parsed.ok)
            errors[field.quantity.name] = parsed.message;
        else if (parsed.value.kind !== APP_MODEL_QUANTITY_KINDS.input)
            errors[field.quantity.name] = labels.formulaRefused;
        else
            inputs.push({ name: field.quantity.name, input: parsed.value.input });
    }
    return Object.keys(errors).length > 0 ? { errors } : { errors, inputs };
}
