import type { SiteStatusComponentStatus, SiteStatusPage } from "@haakco/custd-sdk";
import { type MonitoringAppearance, MonitoringSection } from "./monitoring-section.js";

const defaultStatusLabels: Record<SiteStatusComponentStatus, string> = {
  up: "Operational",
  down: "Outage",
  failing: "Degraded",
  maintenance: "Maintenance",
  paused: "Monitoring paused",
  unknown: "Status unknown",
};

// Public status data omits internal IDs and allows duplicate public labels.
function labelledKeys<T>(values: readonly T[], labelOf: (value: T) => string) {
  const counts = new Map<string, number>();
  return values.map((value) => {
    const label = labelOf(value);
    const count = (counts.get(label) ?? 0) + 1;
    counts.set(label, count);
    return { value, key: JSON.stringify([label, count]) };
  });
}

export type SiteStatusPageViewProps = MonitoringAppearance & {
  page: SiteStatusPage;
  labels?: Partial<{ components: string; updates: string; noComponents: string; noUpdates: string }>;
  statusLabels?: Partial<Record<SiteStatusComponentStatus, string>>;
  formatTime?: (timestamp: string) => string;
};

export function SiteStatusPageView({
  page,
  className,
  style,
  labels,
  statusLabels,
  formatTime = (value) => value,
}: SiteStatusPageViewProps) {
  return (
    <MonitoringSection part="status-page" title={page.title} className={className} style={style}>
      <h3>{labels?.components ?? "Components"}</h3>
      {page.components.length === 0 ? (
        <p>{labels?.noComponents ?? "No components listed."}</p>
      ) : (
        <ul data-custd-part="status-components">
          {labelledKeys(page.components, (component) => component.label).map(({ value: component, key }) => (
            <li key={key} data-custd-part="status-component" data-state={component.status}>
              <span>{component.label}</span>{" "}
              <strong>{statusLabels?.[component.status] ?? defaultStatusLabels[component.status]}</strong>
              {component.lastCheckedAt && (
                <>
                  {" "}
                  <time dateTime={component.lastCheckedAt}>{formatTime(component.lastCheckedAt)}</time>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <h3>{labels?.updates ?? "Updates"}</h3>
      {page.updates.length === 0 ? (
        <p>{labels?.noUpdates ?? "No updates published."}</p>
      ) : (
        <ul data-custd-part="status-updates">
          {labelledKeys(page.updates, (update) => update.publishedAt).map(({ value: update, key }) => (
            <li key={key} data-custd-part="status-update">
              <time dateTime={update.publishedAt}>{formatTime(update.publishedAt)}</time>
              <p>{update.message}</p>
            </li>
          ))}
        </ul>
      )}
    </MonitoringSection>
  );
}
