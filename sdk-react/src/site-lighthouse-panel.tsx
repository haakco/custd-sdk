import type { SiteLighthouseHistory, SiteLighthouseProfile, SiteLighthouseScores } from "@haakco/custd-sdk";
import { type MonitoringAppearance, MonitoringMetrics, MonitoringSection } from "./monitoring-section.js";

const profiles = ["desktop", "mobile"] as const;
const scoreLabels = {
  performance: "Performance",
  accessibility: "Accessibility",
  bestPractices: "Best practices",
  seo: "SEO",
} satisfies Record<keyof SiteLighthouseScores, string>;
const scores = Object.keys(scoreLabels) as (keyof SiteLighthouseScores)[];

export type SiteLighthousePanelProps = MonitoringAppearance & {
  history: SiteLighthouseHistory;
  labels?: Partial<
    {
      title: string;
      empty: string;
      failed: string;
      unavailable: string;
    } & Record<SiteLighthouseProfile | keyof SiteLighthouseScores, string>
  >;
  formatTime?: (timestamp: string) => string;
  formatScore?: (score: number) => string;
};

export function SiteLighthousePanel({
  history,
  className,
  style,
  labels,
  formatTime = (value) => value,
  formatScore = String,
}: SiteLighthousePanelProps) {
  return (
    <MonitoringSection
      part="lighthouse-panel"
      title={labels?.title ?? "Lighthouse scores"}
      className={className}
      style={style}
    >
      {profiles.map((profile) => {
        const run = history.runs
          .filter((run) => run.profile === profile)
          .reduce<(typeof history.runs)[number] | undefined>(
            (latest, current) =>
              !latest || Date.parse(current.observedAt) > Date.parse(latest.observedAt) ? current : latest,
            undefined,
          );
        return (
          <div key={profile} data-custd-part="lighthouse-profile" data-profile={profile}>
            <h3>{labels?.[profile] ?? (profile === "desktop" ? "Desktop" : "Mobile")}</h3>
            {run && <time dateTime={run.observedAt}>{formatTime(run.observedAt)}</time>}
            {!run && <p>{labels?.empty ?? "No runs yet."}</p>}
            {run?.outcome === "failed" && <p>{labels?.failed ?? "The latest run failed."}</p>}
            {run?.outcome === "success" && (
              <MonitoringMetrics part="lighthouse-scores">
                {scores.map((key) => {
                  const score = run.scores[key];
                  return (
                    <div key={key} data-score={key}>
                      <dt>{labels?.[key] ?? scoreLabels[key]}</dt>
                      <dd>{score === undefined ? (labels?.unavailable ?? "Unavailable") : formatScore(score)}</dd>
                    </div>
                  );
                })}
              </MonitoringMetrics>
            )}
          </div>
        );
      })}
    </MonitoringSection>
  );
}
