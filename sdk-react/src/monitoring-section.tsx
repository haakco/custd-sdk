import { type CSSProperties, type ReactNode, useId } from "react";

export type MonitoringAppearance = { className?: string; style?: CSSProperties };

type MonitoringSectionProps = MonitoringAppearance & {
  part: "uptime-panel" | "lighthouse-panel" | "status-page";
  title: string;
  children: ReactNode;
};

export function MonitoringSection({ part, title, className, style, children }: MonitoringSectionProps) {
  const titleId = useId();
  return (
    <section
      className={className}
      style={style}
      aria-labelledby={titleId}
      data-custd-monitoring=""
      data-custd-part={part}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
    </section>
  );
}

export function MonitoringMetrics({
  part,
  children,
}: {
  part: "uptime-windows" | "lighthouse-scores";
  children: ReactNode;
}) {
  return (
    <dl data-custd-metrics="" data-custd-part={part}>
      {children}
    </dl>
  );
}
