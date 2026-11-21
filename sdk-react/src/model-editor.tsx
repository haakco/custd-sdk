import {
  APP_MODEL_INPUT_SHAPES,
  APP_MODEL_QUANTITY_KINDS,
  APP_MODEL_RANGE_DISTRIBUTIONS,
  AppItemError,
  type AppModelInput,
  type AppModelQuantity,
  type AppModelRangeDistribution,
  type AppModelVersionCreateRequest,
} from "@haakco/custd-sdk/browser";
import { type ClipboardEvent, type CSSProperties, type FormEvent, useEffect, useId, useRef, useState } from "react";
import { formatModelValue, parseModelValue, rangeDistributionOf } from "./model-shorthand.js";
import { SafeMarkdown } from "./safe-markdown.js";

export type ModelEditorLabels = {
  title: string;
  name: string;
  value: string;
  valueHint: string;
  unit: string;
  description: string;
  rangeShape: string;
  distributions: Record<AppModelRangeDistribution, string>;
  bound: (source: string) => string;
  add: string;
  remove: (name: string) => string;
  note: string;
  save: string;
  saving: string;
  saved: string;
  nameInvalid: string;
  nameTaken: string;
  saveFailed: string;
};

export type ModelEditorProps = {
  /** The version being edited. Remount with a new `key` to load another version. */
  quantities: AppModelQuantity[];
  /** Saves the edited list as a new version, e.g. `appItems.addModelVersion(ownerToken, request)`. */
  onSave: (request: AppModelVersionCreateRequest) => Promise<unknown>;
  labels?: Partial<ModelEditorLabels>;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: ModelEditorLabels = {
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

type Row = {
  id: number;
  name: string;
  unit: string;
  description: string;
  value: string;
  distribution: AppModelRangeDistribution;
  /** A live input is carried through a save unchanged; the editor cannot retype it. */
  bound?: AppModelInput;
};

type RowErrors = { name?: string; value?: string };
type Status = { state: "idle" | "saving" | "saved" } | { state: "failed"; message: string };

/**
 * Edits a model's quantities in one list: name, value shorthand, unit and a Markdown description
 * shown back safely. Saving sends the whole list as a new version; the server's validation
 * message is shown on the quantity it names, or above the save button.
 */
export function ModelEditor({ quantities, onSave, labels: overrides, className, style }: ModelEditorProps) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const nextId = useRef(quantities.length);
  const [rows, setRows] = useState<Row[]>(() => quantities.map(rowOf));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<number, RowErrors>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const formId = useId();
  const addButton = useRef<HTMLButtonElement>(null);
  // Where focus goes after adding or removing a row: a row's name field, or the Add button.
  const [focusTarget, setFocusTarget] = useState<number | "add" | undefined>();
  useEffect(() => {
    if (focusTarget === undefined) return;
    const target = focusTarget === "add" ? addButton.current : document.getElementById(`${formId}-${focusTarget}-name`);
    target?.focus();
    setFocusTarget(undefined);
  }, [focusTarget, formId]);

  const remove = (id: number) => {
    const at = rows.findIndex((row) => row.id === id);
    const neighbour = rows[at + 1] ?? rows[at - 1];
    setRows((current) => current.filter((row) => row.id !== id));
    setFocusTarget(neighbour ? neighbour.id : "add");
  };

  const update = (id: number, change: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));
    setErrors(({ [id]: _cleared, ...rest }) => rest);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const checked = checkRows(rows, labels);
    setErrors(checked.errors);
    if (!checked.quantities) return;
    setStatus({ state: "saving" });
    try {
      await onSave(note.trim() === "" ? { quantities: checked.quantities } : { quantities: checked.quantities, note });
      setStatus({ state: "saved" });
    } catch (error) {
      const placed = placeFieldErrors(error, rows);
      if (placed) setErrors(placed);
      setStatus({ state: "failed", message: placed ? labels.saveFailed : problemMessage(error, labels.saveFailed) });
    }
  };

  return (
    <form className={className} style={style} onSubmit={submit} noValidate data-custd-model-editor="">
      <fieldset>
        <legend>{labels.title}</legend>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
          {rows.map((row, index) => (
            <QuantityRow
              key={row.id}
              row={row}
              idPrefix={`${formId}-${row.id}`}
              errors={errors[row.id] ?? {}}
              labels={labels}
              position={index}
              onChange={(change) => update(row.id, change)}
              onRemove={() => remove(row.id)}
            />
          ))}
        </ol>
        <button
          ref={addButton}
          type="button"
          onClick={() => {
            nextId.current += 1;
            setRows((current) => [...current, emptyRow(nextId.current)]);
            setFocusTarget(nextId.current);
          }}
        >
          {labels.add}
        </button>
      </fieldset>
      <label htmlFor={`${formId}-note`}>{labels.note}</label>
      <input id={`${formId}-note`} value={note} onChange={(event) => setNote(event.target.value)} />
      {status.state === "failed" ? <p role="alert">{status.message}</p> : null}
      <button type="submit" disabled={status.state === "saving" || rows.length === 0}>
        {status.state === "saving" ? labels.saving : labels.save}
      </button>
      <p aria-live="polite">{status.state === "saved" ? labels.saved : ""}</p>
    </form>
  );
}

type QuantityRowProps = {
  row: Row;
  idPrefix: string;
  errors: RowErrors;
  labels: ModelEditorLabels;
  position: number;
  onChange: (change: Partial<Row>) => void;
  onRemove: () => void;
};

function QuantityRow({ row, idPrefix, errors, labels, position, onChange, onRemove }: QuantityRowProps) {
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
  return (
    <li data-custd-model-quantity={row.name || `#${position + 1}`}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-start" }}>
        <span style={{ display: "grid" }}>
          <label htmlFor={ids.name}>{labels.name}</label>
          <input
            id={ids.name}
            value={row.name}
            spellCheck={false}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? ids.nameError : undefined}
            onChange={(event) => onChange({ name: event.target.value })}
          />
          {errors.name ? <span id={ids.nameError}>{errors.name}</span> : null}
        </span>
        <span style={{ display: "grid", flex: "1 1 14rem" }}>
          <label htmlFor={ids.value}>{labels.value}</label>
          {row.bound?.shape === APP_MODEL_INPUT_SHAPES.bound ? (
            <output id={ids.value}>{labels.bound(row.bound.source.field.replace(/_/g, " "))}</output>
          ) : (
            <input
              id={ids.value}
              value={row.value}
              spellCheck={false}
              aria-invalid={errors.value ? true : undefined}
              aria-describedby={errors.value ? `${ids.valueError} ${ids.hint}` : ids.hint}
              onChange={(event) => onChange({ value: event.target.value })}
              onPaste={(event) => pasteSamples(event, (value) => onChange({ value }))}
            />
          )}
          <span id={ids.hint} style={{ fontSize: "0.85em", opacity: 0.75 }}>
            {row.bound ? "" : labels.valueHint}
          </span>
          {errors.value ? <span id={ids.valueError}>{errors.value}</span> : null}
        </span>
        <span style={{ display: "grid" }}>
          <label htmlFor={ids.shape}>{labels.rangeShape}</label>
          <select
            id={ids.shape}
            value={row.distribution}
            disabled={!isRange}
            onChange={(event) => onChange({ distribution: event.target.value as AppModelRangeDistribution })}
          >
            {Object.values(APP_MODEL_RANGE_DISTRIBUTIONS).map((shape) => (
              <option key={shape} value={shape}>
                {labels.distributions[shape]}
              </option>
            ))}
          </select>
        </span>
        <span style={{ display: "grid" }}>
          <label htmlFor={ids.unit}>{labels.unit}</label>
          <input id={ids.unit} value={row.unit} onChange={(event) => onChange({ unit: event.target.value })} />
        </span>
        <button type="button" onClick={onRemove} style={{ alignSelf: "end" }}>
          {labels.remove(row.name)}
        </button>
      </div>
      <label htmlFor={ids.description}>{labels.description}</label>
      <textarea
        id={ids.description}
        value={row.description}
        rows={2}
        onChange={(event) => onChange({ description: event.target.value })}
      />
      {row.description.trim() !== "" ? <SafeMarkdown source={row.description} /> : null}
    </li>
  );
}

/** A pasted spreadsheet column is one number per line; a one-line field keeps them apart as `a, b`. */
function pasteSamples(event: ClipboardEvent<HTMLInputElement>, setValue: (value: string) => void) {
  const pasted = event.clipboardData.getData("text");
  if (!/[\r\n]/.test(pasted)) return;
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

function rowOf(quantity: AppModelQuantity, index: number): Row {
  const bound =
    quantity.kind === APP_MODEL_QUANTITY_KINDS.input && quantity.input.shape === APP_MODEL_INPUT_SHAPES.bound
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

function emptyRow(id: number): Row {
  return { id, name: "", unit: "", description: "", value: "", distribution: APP_MODEL_RANGE_DISTRIBUTIONS.normal };
}

function checkRows(
  rows: Row[],
  labels: ModelEditorLabels,
): { errors: Record<number, RowErrors>; quantities?: AppModelQuantity[] } {
  const errors: Record<number, RowErrors> = {};
  const seen = new Set<string>();
  const quantities: AppModelQuantity[] = [];
  for (const row of rows) {
    const rowErrors: RowErrors = {};
    if (!NAME.test(row.name)) rowErrors.name = labels.nameInvalid;
    else if (seen.has(row.name)) rowErrors.name = labels.nameTaken;
    seen.add(row.name);
    const base = { name: row.name, ...optional("unit", row.unit), ...optional("description", row.description) };
    if (row.bound) {
      quantities.push({ ...base, kind: APP_MODEL_QUANTITY_KINDS.input, input: row.bound });
    } else {
      const parsed = parseModelValue(row.value, row.distribution);
      if (parsed.ok) quantities.push({ ...base, ...parsed.value });
      else rowErrors.value = parsed.message;
    }
    if (rowErrors.name || rowErrors.value) errors[row.id] = rowErrors;
  }
  return Object.keys(errors).length > 0 ? { errors } : { errors, quantities };
}

function optional<K extends string>(key: K, value: string): Partial<Record<K, string>> {
  return value.trim() === "" ? {} : ({ [key]: value } as Record<K, string>);
}

/**
 * Puts the server's field errors on the rows they name: `subject` is the quantity name, so a cycle
 * marks every quantity in it. Undefined when none names a row on screen.
 */
function placeFieldErrors(error: unknown, rows: Row[]): Record<number, RowErrors> | undefined {
  const fieldErrors = error instanceof AppItemError ? (error.problem?.fieldErrors ?? []) : [];
  const placed: Record<number, RowErrors> = {};
  for (const fieldError of fieldErrors) {
    const row = rows.find((candidate) => candidate.name === fieldError.subject);
    if (!row) continue;
    const slot = fieldError.field === "name" ? "name" : "value";
    placed[row.id] = { ...placed[row.id], [slot]: fieldError.message };
  }
  return Object.keys(placed).length > 0 ? placed : undefined;
}

function problemMessage(error: unknown, fallback: string): string {
  const detail = error instanceof AppItemError ? error.problem?.detail : undefined;
  return detail ? detail.replace(/^uncertainty model: invalid:\s*/, "") : fallback;
}
