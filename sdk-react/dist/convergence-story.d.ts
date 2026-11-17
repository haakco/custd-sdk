import type { CSSProperties } from "react";
import type { ConvergenceEstimate } from "./forecast-types.js";
export type ConvergenceStoryLabels = {
    empty: string;
    firstEstimate: string;
    latest: (low: string, high: string) => string;
    /** `movementDays` is positive when the estimate moved later; `widthChangeDays` is negative when it narrowed. */
    change: (movementDays: number, widthChangeDays: number) => string;
    stale: (ageDays: number) => string;
};
export type ConvergenceStoryProps = {
    /** Dated estimates, oldest first (`delivery.estimates`). */
    estimates: readonly ConvergenceEstimate[];
    /** The delivery target date (`delivery.targetDate`). */
    targetDate?: string;
    title: string;
    summary?: string;
    /** Marks the latest estimate stale once it is older than this many days. */
    staleAfterDays?: number;
    /** The time staleness is measured against; defaults to now. */
    now?: string;
    labels?: Partial<ConvergenceStoryLabels>;
    formatDate?: (epochMs: number) => string;
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
};
export declare function ConvergenceStory({ estimates, targetDate, title, summary, staleAfterDays, now, labels: labelOverrides, formatDate, width, height, className, style, }: ConvergenceStoryProps): import("react").JSX.Element;
