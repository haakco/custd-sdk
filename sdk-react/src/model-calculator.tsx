import {
  APP_MODEL_ERROR_CODES,
  APP_MODEL_INPUT_SHAPES,
  APP_MODEL_QUANTITY_KINDS,
  type AppItemAccess,
  AppItemError,
  type AppItemsClient,
  type AppModelInput,
  type AppModelQuantity,
  type AppModelQuantityResult,
  type AppModelQueuedRunFailure,
  type AppModelVersion,
  HOSTED_APP_STATUSES,
} from "@haakco/custd-sdk/browser";
import { type CSSProperties, type FormEvent, useId, useState } from "react";
import { useOptionalCustdHostedApp } from "./hosted-app.js";
import { formatModelNumber, formatModelValue, parseModelValue, rangeDistributionOf } from "./model-shorthand.js";

/** One input value the calculator tries, in place of the saved one, for this run only. */
export type ModelCalculatorInput = { name: string; input: AppModelInput };

/** A run over a saved version with some inputs replaced. It must never save a version. */
export type ModelCalculatorRequest = {
  versionNumber: number;
  inputs: ModelCalculatorInput[];
  outputs: string[];
};

/** A calculation's results, or a latest run's, which may say its queued live-input run failed. */
export type ModelCalculatorResult = {
  quantities: AppModelQuantityResult[] | null;
  queuedRunFailure?: AppModelQueuedRunFailure;
};

export type ModelCalculatorLabels = {
  inputs: string;
  outputs: string;
  calculate: string;
  calculating: string;
  unavailable: string;
  failed: string;
  limited: string;
  queuedRunFailed: (failure: AppModelQueuedRunFailure) => string;
  notCalculated: string;
  formulaRefused: string;
  output: (mean: string, low: string, high: string) => string;
};

export type ModelCalculatorProps = {
  version: AppModelVersion;
  /** The input quantities the form offers; bound and formula quantities are skipped. */
  inputs: string[];
  /** The quantities whose results it shows. */
  outputs: string[];
  /** Results shown before the first calculation, such as the latest run. */
  baseline?: ModelCalculatorResult;
  /**
   * Runs the version with the form's values without saving anything. Defaults to the client's
   * `calculateModel` when `access` is given; absent both, the form is read-only.
   */
  calculate?: (request: ModelCalculatorRequest) => Promise<ModelCalculatorResult>;
  /** The item's link token, or `{ item }` for a signed-in owner; any link may calculate. */
  access?: AppItemAccess;
  /** Defaults to the `CustdHostedAppProvider` app's `appItems`. */
  client?: AppItemsClient;
  labels?: Partial<ModelCalculatorLabels>;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: ModelCalculatorLabels = {
  inputs: "Try values",
  outputs: "Results",
  calculate: "Calculate",
  calculating: "Calculating…",
  unavailable: "Calculating with other values is not available here yet.",
  failed: "The calculation did not run.",
  limited: "Too many calculations just now. Try again in a minute.",
  queuedRunFailed: ({ error, attempts, failedAt }) =>
    `Live inputs changed but the new run failed after ${attempts} ${attempts === 1 ? "try" : "tries"} (last ${new Date(failedAt).toLocaleString()}): ${error}. These results are older.`,
  notCalculated: "not calculated",
  formulaRefused: "A calculator takes a value, a range or k of n, not a formula.",
  output: (mean, low, high) => `${mean} (90%: ${low} to ${high})`,
};

type Field = { quantity: AppModelQuantity & { kind: "input" }; text: string };

/** A form over chosen inputs and outputs of a saved version. Calculating never changes the model. */
export function ModelCalculator({
  version,
  inputs,
  outputs,
  baseline,
  calculate: given,
  access,
  client,
  labels: overrides,
  className,
  style,
}: ModelCalculatorProps) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const hosted = useOptionalCustdHostedApp();
  const runner = client ?? (hosted?.status === HOSTED_APP_STATUSES.ready ? hosted.app.appItems : undefined);
  const calculate =
    given ??
    (runner && access ? (request: ModelCalculatorRequest) => runner.calculateModel(access, request) : undefined);
  const formId = useId();
  const [fields, setFields] = useState<Field[]>(() => calculatorFields(version.quantities, inputs));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ModelCalculatorResult | undefined>();
  const [state, setState] = useState<"idle" | "running" | "failed" | "limited">("idle");
  const shown = result ?? baseline;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!calculate) return;
    const checked = checkFields(fields, labels);
    setErrors(checked.errors);
    if (!checked.inputs) return;
    setState("running");
    try {
      setResult(await calculate({ versionNumber: version.versionNumber, inputs: checked.inputs, outputs }));
      setState("idle");
    } catch (error) {
      const limited = error instanceof AppItemError && error.code === APP_MODEL_ERROR_CODES.calculateLimited;
      setState(limited ? "limited" : "failed");
    }
  };

  return (
    <form className={className} style={style} onSubmit={submit} noValidate data-custd-model-calculator="">
      <fieldset>
        <legend>{labels.inputs}</legend>
        {fields.map((field, index) => {
          const id = `${formId}-${field.quantity.name}`;
          const error = errors[field.quantity.name];
          return (
            <div key={field.quantity.name} style={{ display: "grid" }}>
              <label htmlFor={id}>
                {field.quantity.name}
                {field.quantity.unit ? ` (${field.quantity.unit})` : ""}
              </label>
              <input
                id={id}
                value={field.text}
                readOnly={!calculate}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) =>
                  setFields((current) =>
                    current.map((other, at) => (at === index ? { ...other, text: event.target.value } : other)),
                  )
                }
              />
              {error ? <span id={`${id}-error`}>{error}</span> : null}
            </div>
          );
        })}
      </fieldset>
      {calculate ? (
        <button type="submit" disabled={state === "running"}>
          {state === "running" ? labels.calculating : labels.calculate}
        </button>
      ) : (
        <p>{labels.unavailable}</p>
      )}
      {state === "failed" || state === "limited" ? <p role="alert">{labels[state]}</p> : null}
      {!result && baseline?.queuedRunFailure ? (
        <p role="status">{labels.queuedRunFailed(baseline.queuedRunFailure)}</p>
      ) : null}
      <section aria-live="polite" aria-label={labels.outputs}>
        <dl>
          {outputs.map((name) => (
            <OutputRow key={name} name={name} result={shown} labels={labels} version={version} />
          ))}
        </dl>
      </section>
    </form>
  );
}

function OutputRow({
  name,
  result,
  labels,
  version,
}: {
  name: string;
  result: ModelCalculatorResult | undefined;
  labels: ModelCalculatorLabels;
  version: AppModelVersion;
}) {
  const quantity = result?.quantities?.find((candidate) => candidate.name === name);
  const unit = version.quantities.find((candidate) => candidate.name === name)?.unit;
  const show = (value: number) => (unit ? `${formatModelNumber(value)} ${unit}` : formatModelNumber(value));
  const summary = quantity?.summary;
  return (
    <div data-custd-calculator-output={name}>
      <dt>{name}</dt>
      <dd>
        {summary
          ? labels.output(show(summary.mean), show(summary.percentiles.p5), show(summary.percentiles.p95))
          : (quantity?.error?.detail ?? labels.notCalculated)}
      </dd>
    </div>
  );
}

function calculatorFields(quantities: AppModelQuantity[], names: string[]): Field[] {
  const fields: Field[] = [];
  for (const name of names) {
    const quantity = quantities.find((candidate) => candidate.name === name);
    if (quantity?.kind !== APP_MODEL_QUANTITY_KINDS.input || quantity.input.shape === APP_MODEL_INPUT_SHAPES.bound) {
      continue;
    }
    fields.push({ quantity, text: formatModelValue(quantity) });
  }
  return fields;
}

function checkFields(
  fields: Field[],
  labels: ModelCalculatorLabels,
): { errors: Record<string, string>; inputs?: ModelCalculatorInput[] } {
  const errors: Record<string, string> = {};
  const inputs: ModelCalculatorInput[] = [];
  for (const field of fields) {
    const parsed = parseModelValue(field.text, rangeDistributionOf(field.quantity));
    if (!parsed.ok) errors[field.quantity.name] = parsed.message;
    else if (parsed.value.kind !== APP_MODEL_QUANTITY_KINDS.input) errors[field.quantity.name] = labels.formulaRefused;
    else inputs.push({ name: field.quantity.name, input: parsed.value.input });
  }
  return Object.keys(errors).length > 0 ? { errors } : { errors, inputs };
}
