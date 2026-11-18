import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_MODEL_INPUT_SHAPES, APP_MODEL_QUANTITY_KINDS, APP_MODEL_RANGE_DISTRIBUTIONS, AppItemError, } from "@haakco/custd-sdk/browser";
import { useEffect, useId, useRef, useState } from "react";
import { formatModelValue, parseModelValue, rangeDistributionOf } from "./model-shorthand.js";
import { SafeMarkdown } from "./safe-markdown.js";
const DEFAULT_LABELS = {
    title: "Quantities",
    name: "Name",
    value: "Value",
    valueHint: "A number, 5 to 10 (90% range), 1 of 5, pasted numbers, or =formula.",
    unit: "Unit",
    description: "Description (Markdown)",
    rangeShape: "Range shape",
    distributions: { normal: "Normal", lognormal: "Lognormal", uniform: "Uniform" },
    bound: (source) => `Live from ${source}`,
    add: "Add quantity",
    remove: (name) => `Remove ${name || "quantity"}`,
    note: "Version note",
    save: "Save version",
    saving: "Saving…",
    saved: "Saved.",
    nameInvalid: "Start with a letter or _, then letters, digits or _.",
    nameTaken: "Another quantity has this name.",
    saveFailed: "The version was not saved.",
};
const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
/**
 * Edits a model's quantities in one list: name, value shorthand, unit and a Markdown description
 * shown back safely. Saving sends the whole list as a new version; the server's validation
 * message is shown on the quantity it names, or above the save button.
 */
export function ModelEditor({ quantities, onSave, labels: overrides, className, style }) {
    const labels = { ...DEFAULT_LABELS, ...overrides };
    const nextId = useRef(quantities.length);
    const [rows, setRows] = useState(() => quantities.map(rowOf));
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState({ state: "idle" });
    const formId = useId();
    const addButton = useRef(null);
    // Where focus goes after adding or removing a row: a row's name field, or the Add button.
    const [focusTarget, setFocusTarget] = useState();
    useEffect(() => {
        if (focusTarget === undefined)
            return;
        const target = focusTarget === "add" ? addButton.current : document.getElementById(`${formId}-${focusTarget}-name`);
        target?.focus();
        setFocusTarget(undefined);
    }, [focusTarget, formId]);
    const remove = (id) => {
        const at = rows.findIndex((row) => row.id === id);
        const neighbour = rows[at + 1] ?? rows[at - 1];
        setRows((current) => current.filter((row) => row.id !== id));
        setFocusTarget(neighbour ? neighbour.id : "add");
    };
    const update = (id, change) => {
        setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));
        setErrors(({ [id]: _cleared, ...rest }) => rest);
    };
    const submit = async (event) => {
        event.preventDefault();
        const checked = checkRows(rows, labels);
        setErrors(checked.errors);
        if (!checked.quantities)
            return;
        setStatus({ state: "saving" });
        try {
            await onSave(note.trim() === "" ? { quantities: checked.quantities } : { quantities: checked.quantities, note });
            setStatus({ state: "saved" });
        }
        catch (error) {
            const placed = placeFieldErrors(error, rows);
            if (placed)
                setErrors(placed);
            setStatus({ state: "failed", message: placed ? labels.saveFailed : problemMessage(error, labels.saveFailed) });
        }
    };
    return (_jsxs("form", { className: className, style: style, onSubmit: submit, noValidate: true, "data-custd-model-editor": "", children: [_jsxs("fieldset", { children: [_jsx("legend", { children: labels.title }), _jsx("ol", { style: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }, children: rows.map((row, index) => (_jsx(QuantityRow, { row: row, idPrefix: `${formId}-${row.id}`, errors: errors[row.id] ?? {}, labels: labels, position: index, onChange: (change) => update(row.id, change), onRemove: () => remove(row.id) }, row.id))) }), _jsx("button", { ref: addButton, type: "button", onClick: () => {
                            nextId.current += 1;
                            setRows((current) => [...current, emptyRow(nextId.current)]);
                            setFocusTarget(nextId.current);
                        }, children: labels.add })] }), _jsx("label", { htmlFor: `${formId}-note`, children: labels.note }), _jsx("input", { id: `${formId}-note`, value: note, onChange: (event) => setNote(event.target.value) }), status.state === "failed" ? _jsx("p", { role: "alert", children: status.message }) : null, _jsx("button", { type: "submit", disabled: status.state === "saving" || rows.length === 0, children: status.state === "saving" ? labels.saving : labels.save }), _jsx("p", { "aria-live": "polite", children: status.state === "saved" ? labels.saved : "" })] }));
}
function QuantityRow({ row, idPrefix, errors, labels, position, onChange, onRemove }) {
    const ids = {
        name: `${idPrefix}-name`,
        value: `${idPrefix}-value`,
        hint: `${idPrefix}-hint`,
        valueError: `${idPrefix}-value-error`,
        nameError: `${idPrefix}-name-error`,
        unit: `${idPrefix}-unit`,
        shape: `${idPrefix}-shape`,
        description: `${idPrefix}-description`,
    };
    const parsed = row.bound ? undefined : parseModelValue(row.value, row.distribution);
    const isRange = parsed?.ok === true && parsed.value.kind === "input" && parsed.value.input.shape === "range";
    return (_jsxs("li", { "data-custd-model-quantity": row.name || `#${position + 1}`, children: [_jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-start" }, children: [_jsxs("span", { style: { display: "grid" }, children: [_jsx("label", { htmlFor: ids.name, children: labels.name }), _jsx("input", { id: ids.name, value: row.name, spellCheck: false, "aria-invalid": errors.name ? true : undefined, "aria-describedby": errors.name ? ids.nameError : undefined, onChange: (event) => onChange({ name: event.target.value }) }), errors.name ? _jsx("span", { id: ids.nameError, children: errors.name }) : null] }), _jsxs("span", { style: { display: "grid", flex: "1 1 14rem" }, children: [_jsx("label", { htmlFor: ids.value, children: labels.value }), row.bound?.shape === APP_MODEL_INPUT_SHAPES.bound ? (_jsx("output", { id: ids.value, children: labels.bound(row.bound.source.field.replace(/_/g, " ")) })) : (_jsx("input", { id: ids.value, value: row.value, spellCheck: false, "aria-invalid": errors.value ? true : undefined, "aria-describedby": errors.value ? `${ids.valueError} ${ids.hint}` : ids.hint, onChange: (event) => onChange({ value: event.target.value }), onPaste: (event) => pasteSamples(event, (value) => onChange({ value })) })), _jsx("span", { id: ids.hint, style: { fontSize: "0.85em", opacity: 0.75 }, children: row.bound ? "" : labels.valueHint }), errors.value ? _jsx("span", { id: ids.valueError, children: errors.value }) : null] }), _jsxs("span", { style: { display: "grid" }, children: [_jsx("label", { htmlFor: ids.shape, children: labels.rangeShape }), _jsx("select", { id: ids.shape, value: row.distribution, disabled: !isRange, onChange: (event) => onChange({ distribution: event.target.value }), children: Object.values(APP_MODEL_RANGE_DISTRIBUTIONS).map((shape) => (_jsx("option", { value: shape, children: labels.distributions[shape] }, shape))) })] }), _jsxs("span", { style: { display: "grid" }, children: [_jsx("label", { htmlFor: ids.unit, children: labels.unit }), _jsx("input", { id: ids.unit, value: row.unit, onChange: (event) => onChange({ unit: event.target.value }) })] }), _jsx("button", { type: "button", onClick: onRemove, style: { alignSelf: "end" }, children: labels.remove(row.name) })] }), _jsx("label", { htmlFor: ids.description, children: labels.description }), _jsx("textarea", { id: ids.description, value: row.description, rows: 2, onChange: (event) => onChange({ description: event.target.value }) }), row.description.trim() !== "" ? _jsx(SafeMarkdown, { source: row.description }) : null] }));
}
/** A pasted spreadsheet column is one number per line; a one-line field keeps them apart as `a, b`. */
function pasteSamples(event, setValue) {
    const pasted = event.clipboardData.getData("text");
    if (!/[\r\n]/.test(pasted))
        return;
    event.preventDefault();
    const field = event.currentTarget;
    const joined = pasted
        .split(/[\r\n]+/)
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .join(", ");
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;
    setValue(`${field.value.slice(0, start)}${joined}${field.value.slice(end)}`);
}
function rowOf(quantity, index) {
    const bound = quantity.kind === APP_MODEL_QUANTITY_KINDS.input && quantity.input.shape === APP_MODEL_INPUT_SHAPES.bound
        ? quantity.input
        : undefined;
    return {
        id: index,
        name: quantity.name,
        unit: quantity.unit ?? "",
        description: quantity.description ?? "",
        value: formatModelValue(quantity),
        distribution: rangeDistributionOf(quantity),
        bound,
    };
}
function emptyRow(id) {
    return { id, name: "", unit: "", description: "", value: "", distribution: APP_MODEL_RANGE_DISTRIBUTIONS.normal };
}
function checkRows(rows, labels) {
    const errors = {};
    const seen = new Set();
    const quantities = [];
    for (const row of rows) {
        const rowErrors = {};
        if (!NAME.test(row.name))
            rowErrors.name = labels.nameInvalid;
        else if (seen.has(row.name))
            rowErrors.name = labels.nameTaken;
        seen.add(row.name);
        const base = { name: row.name, ...optional("unit", row.unit), ...optional("description", row.description) };
        if (row.bound) {
            quantities.push({ ...base, kind: APP_MODEL_QUANTITY_KINDS.input, input: row.bound });
        }
        else {
            const parsed = parseModelValue(row.value, row.distribution);
            if (parsed.ok)
                quantities.push({ ...base, ...parsed.value });
            else
                rowErrors.value = parsed.message;
        }
        if (rowErrors.name || rowErrors.value)
            errors[row.id] = rowErrors;
    }
    return Object.keys(errors).length > 0 ? { errors } : { errors, quantities };
}
function optional(key, value) {
    return value.trim() === "" ? {} : { [key]: value };
}
/**
 * Puts the server's field errors on the rows they name: `subject` is the quantity name, so a cycle
 * marks every quantity in it. Undefined when none names a row on screen.
 */
function placeFieldErrors(error, rows) {
    const fieldErrors = error instanceof AppItemError ? (error.problem?.fieldErrors ?? []) : [];
    const placed = {};
    for (const fieldError of fieldErrors) {
        const row = rows.find((candidate) => candidate.name === fieldError.subject);
        if (!row)
            continue;
        const slot = fieldError.field === "name" ? "name" : "value";
        placed[row.id] = { ...placed[row.id], [slot]: fieldError.message };
    }
    return Object.keys(placed).length > 0 ? placed : undefined;
}
function problemMessage(error, fallback) {
    const detail = error instanceof AppItemError ? error.problem?.detail : undefined;
    return detail ? detail.replace(/^uncertainty model: invalid:\s*/, "") : fallback;
}
