/**
 * Real-user Core Web Vitals for one document load, read with the browser's own
 * PerformanceObserver entries. A metric the browser cannot observe, or that the
 * visit never produced (INP without an interaction), is absent rather than zero.
 */
export type WebVitalsSnapshot = {
    /** Largest Contentful Paint, in milliseconds. */
    lcp?: number;
    /** Interaction to Next Paint, in milliseconds. */
    inp?: number;
    /** Cumulative Layout Shift, a unitless score. */
    cls?: number;
    /** First Contentful Paint, in milliseconds. */
    fcp?: number;
    /** Time to First Byte, in milliseconds. */
    ttfb?: number;
};
export type WebVitalsCollector = {
    snapshot: () => WebVitalsSnapshot;
    stop: () => void;
};
export declare function startWebVitals(): WebVitalsCollector;
