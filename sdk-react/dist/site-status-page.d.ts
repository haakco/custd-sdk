import type { SiteStatusComponentStatus, SiteStatusPage } from "@haakco/custd-sdk";
import { type MonitoringAppearance } from "./monitoring-section.js";
export type SiteStatusPageViewProps = MonitoringAppearance & {
    page: SiteStatusPage;
    labels?: Partial<{
        components: string;
        updates: string;
        noComponents: string;
        noUpdates: string;
    }>;
    statusLabels?: Partial<Record<SiteStatusComponentStatus, string>>;
    formatTime?: (timestamp: string) => string;
};
export declare function SiteStatusPageView({ page, className, style, labels, statusLabels, formatTime, }: SiteStatusPageViewProps): import("react").JSX.Element;
