import type { AppModelDecision, AppModelInformation } from "@haakco/custd-sdk/browser";
import type { CSSProperties } from "react";
import { formatModelNumber } from "./model-shorthand.js";

export type MeasureNextPanelLabels = {
  title: string;
  noDecision: string;
  recommendation: (recommended: "act" | "hold", actProbability: string) => string;
  decision: (output: string, threshold: string) => string;
  suggested: (input: string) => string;
  nothingWorthwhile: string;
  certaintyWorth: (value: string) => string;
  inputWorth: (value: string) => string;
};

export type MeasureNextPanelProps = {
  /** `run.information`; absent when the run had no decision. */
  information: AppModelInformation | undefined;
  /** `run.decision`, to say what was decided. */
  decision?: AppModelDecision;
  formatValue?: (value: number) => string;
  labels?: Partial<MeasureNextPanelLabels>;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_LABELS: MeasureNextPanelLabels = {
  title: "What to measure next",
  noDecision: "Set a decision (a threshold on an output) to see which input is worth measuring first.",
  recommendation: (recommended, chance) =>
    recommended === "act" ? `Act now: ${chance} chance acting pays.` : `Hold: only ${chance} chance acting pays.`,
  decision: (output, threshold) => `Deciding on ${output} against ${threshold}.`,
  suggested: (input) => `Measure ${input} next.`,
  nothingWorthwhile: "No single measurement is worth its cost now: decide with what you know.",
  certaintyWorth: (value) => `Knowing everything exactly would be worth ${value}.`,
  inputWorth: (value) => `worth ${value} to know exactly`,
};

/** The decision's recommendation and the inputs ranked by what knowing each exactly is worth. */
export function MeasureNextPanel({
  information,
  decision,
  formatValue = formatModelNumber,
  labels: overrides,
  className,
  style,
}: MeasureNextPanelProps) {
  const labels = { ...DEFAULT_LABELS, ...overrides };
  if (!information) {
    return (
      <section className={className} style={style} data-custd-measure-next="none">
        <h3>{labels.title}</h3>
        <p>{labels.noDecision}</p>
      </section>
    );
  }
  const ranked = [...(information.inputs ?? [])].sort(
    (left, right) => right.expectedValueOfPerfectInformation - left.expectedValueOfPerfectInformation,
  );
  const suggested = information.suggestedNextMeasurement;
  const chance = `${Math.round(information.actProbability * 100)}%`;
  return (
    <section className={className} style={style} data-custd-measure-next={suggested || "nothing"}>
      <h3>{labels.title}</h3>
      {decision ? <p>{labels.decision(decision.output, formatValue(decision.threshold))}</p> : null}
      <p>{labels.recommendation(information.recommended, chance)}</p>
      <p>
        <strong>{suggested ? labels.suggested(suggested) : labels.nothingWorthwhile}</strong>
      </p>
      <p>{labels.certaintyWorth(formatValue(information.expectedValueOfPerfectInformation))}</p>
      {ranked.length > 0 ? (
        <ol>
          {ranked.map((input) => (
            <li key={input.name} aria-current={input.name === suggested ? "true" : undefined}>
              {input.name}: {labels.inputWorth(formatValue(input.expectedValueOfPerfectInformation))}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
