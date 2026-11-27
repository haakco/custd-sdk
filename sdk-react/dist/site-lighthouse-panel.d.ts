import type { SiteLighthouseHistory, SiteLighthouseProfile, SiteLighthouseScores } from "@haakco/custd-sdk";
import { type MonitoringAppearance } from "./monitoring-section.js";
export type SiteLighthousePanelProps = MonitoringAppearance & {
    history: SiteLighthouseHistory;
    labels?: Partial<{
        title: string;
        empty: string;
        failed: string;
        unavailable: string;
    } & Record<SiteLighthouseProfile | keyof SiteLighthouseScores, string>>;
    formatTime?: (timestamp: string) => string;
    formatScore?: (score: number) => string;
};
export declare function SiteLighthousePanel({ history, className, style, labels, formatTime, formatScore, }: SiteLighthousePanelProps): import("react").JSX.Element;
