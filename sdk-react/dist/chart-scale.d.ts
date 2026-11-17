/** A closed numeric range; time domains are milliseconds since the epoch. */
export type ChartDomain = {
    start: number;
    end: number;
};
export declare const DAY_MS = 86400000;
export declare function parseTime(value: string): number;
export declare function scaleLinear(domain: ChartDomain, rangeStart: number, rangeEnd: number): (value: number) => number;
/** The extent of the finite values, padded to at least `minSpan` so a single value stays visible. */
export declare function domainOf(values: readonly number[], minSpan: number): ChartDomain | undefined;
/** Scales the span around its centre by `factor` (below 1 zooms in), kept inside `bounds`. */
export declare function zoomDomain(view: ChartDomain, factor: number, bounds: ChartDomain, minSpan: number): ChartDomain;
/** Moves the view by `fraction` of its span (negative is earlier), kept inside `bounds`. */
export declare function panDomain(view: ChartDomain, fraction: number, bounds: ChartDomain): ChartDomain;
export declare function sameDomain(left: ChartDomain, right: ChartDomain): boolean;
export declare function ticksOf(domain: ChartDomain, count: number): number[];
export declare function formatUtcDate(value: number): string;
export declare function formatNumber(value: number): string;
export declare function usePrefersReducedMotion(): boolean;
/** Eases the drawn domain towards `target`; jumps straight there when motion is reduced. */
export declare function useTweenedDomain(target: ChartDomain, reducedMotion: boolean): ChartDomain;
