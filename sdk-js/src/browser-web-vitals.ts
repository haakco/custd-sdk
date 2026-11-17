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

type LayoutShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean };
type InteractionEntry = PerformanceEntry & { interactionId?: number };
type NavigationEntry = PerformanceEntry & { responseStart: number; activationStart?: number };

/** Layout shifts closer together than this belong to one session window. */
const clsSessionGapMs = 1000;
/** A layout-shift session window never spans longer than this. */
const clsSessionMaxMs = 5000;
/** Interactions shorter than this cannot be the page's INP. */
const inpDurationThresholdMs = 40;
/** INP ignores one outlier for every this many interactions. */
const inpInteractionsPerOutlier = 50;
/** Bounds the per-document interaction memory. */
const maxTrackedInteractions = 1000;

export function startWebVitals(): WebVitalsCollector {
  const supported = supportedEntryTypes();
  const hiddenAtStart = typeof document !== "undefined" && document.visibilityState === "hidden";
  const state = { lcp: undefined as number | undefined, fcp: undefined as number | undefined };
  const cls = { value: 0, session: 0, first: 0, last: 0 };
  const interactions = new Map<number, number>();
  const observers: PerformanceObserver[] = [];

  const observe = (type: string, onEntries: (entries: PerformanceEntry[]) => void, extra = {}) => {
    if (!supported.includes(type)) {
      return;
    }
    const observer = new PerformanceObserver((list) => onEntries(list.getEntries()));
    observer.observe({ type, buffered: true, ...extra });
    observers.push(observer);
  };

  observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) state.lcp = last.startTime;
  });
  observe("paint", (entries) => {
    const fcp = entries.find((entry) => entry.name === "first-contentful-paint");
    if (fcp) state.fcp = fcp.startTime;
  });
  observe("layout-shift", (entries) => addLayoutShifts(cls, entries as LayoutShiftEntry[]));
  observe("event", (entries) => addInteractions(interactions, entries as InteractionEntry[]), {
    durationThreshold: inpDurationThresholdMs,
  });
  observe("first-input", (entries) => addInteractions(interactions, entries as InteractionEntry[]));

  return {
    snapshot: () => {
      const snapshot: WebVitalsSnapshot = {};
      setMilliseconds(snapshot, "lcp", hiddenAtStart ? undefined : state.lcp);
      setMilliseconds(snapshot, "fcp", hiddenAtStart ? undefined : state.fcp);
      setMilliseconds(snapshot, "inp", interactionToNextPaint(interactions));
      setMilliseconds(snapshot, "ttfb", timeToFirstByte());
      if (supported.includes("layout-shift") && Number.isFinite(cls.value) && cls.value >= 0) {
        snapshot.cls = Math.round(cls.value * 10_000) / 10_000;
      }
      return snapshot;
    },
    stop: () => {
      for (const observer of observers.splice(0, observers.length)) {
        observer.disconnect();
      }
    },
  };
}

function supportedEntryTypes(): readonly string[] {
  if (typeof PerformanceObserver === "undefined") {
    return [];
  }
  return PerformanceObserver.supportedEntryTypes ?? [];
}

/** CLS is the largest session window of shifts the visitor did not cause. */
function addLayoutShifts(
  cls: { value: number; session: number; first: number; last: number },
  entries: LayoutShiftEntry[],
): void {
  for (const entry of entries) {
    if (entry.hadRecentInput) {
      continue;
    }
    const continuesSession =
      cls.session > 0 && entry.startTime - cls.last < clsSessionGapMs && entry.startTime - cls.first < clsSessionMaxMs;
    if (continuesSession) {
      cls.session += entry.value;
    } else {
      cls.session = entry.value;
      cls.first = entry.startTime;
    }
    cls.last = entry.startTime;
    cls.value = Math.max(cls.value, cls.session);
  }
}

function addInteractions(interactions: Map<number, number>, entries: InteractionEntry[]): void {
  for (const entry of entries) {
    const id = entry.interactionId ?? 0;
    if (id === 0 || (!interactions.has(id) && interactions.size >= maxTrackedInteractions)) {
      continue;
    }
    interactions.set(id, Math.max(interactions.get(id) ?? 0, entry.duration));
  }
}

/** The slowest interaction, skipping one outlier per 50 interactions. */
function interactionToNextPaint(interactions: Map<number, number>): number | undefined {
  if (interactions.size === 0) {
    return undefined;
  }
  const durations = [...interactions.values()].sort((a, b) => b - a);
  const index = Math.min(Math.floor(interactions.size / inpInteractionsPerOutlier), durations.length - 1);
  return durations[index];
}

function timeToFirstByte(): number | undefined {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
    return undefined;
  }
  const navigation = performance.getEntriesByType("navigation")[0] as NavigationEntry | undefined;
  if (!navigation) {
    return undefined;
  }
  return navigation.responseStart - Math.max(navigation.activationStart ?? 0, 0);
}

function setMilliseconds(snapshot: WebVitalsSnapshot, key: "lcp" | "inp" | "fcp" | "ttfb", value?: number): void {
  if (value !== undefined && Number.isFinite(value) && value >= 0) {
    snapshot[key] = Math.round(value);
  }
}
