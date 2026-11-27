import { type CSSProperties, type ReactNode } from "react";
export type MonitoringAppearance = {
    className?: string;
    style?: CSSProperties;
};
type MonitoringSectionProps = MonitoringAppearance & {
    part: "uptime-panel" | "lighthouse-panel" | "status-page";
    title: string;
    children: ReactNode;
};
export declare function MonitoringSection({ part, title, className, style, children }: MonitoringSectionProps): import("react").JSX.Element;
export declare function MonitoringMetrics({ part, children, }: {
    part: "uptime-windows" | "lighthouse-scores";
    children: ReactNode;
}): import("react").JSX.Element;
export {};
