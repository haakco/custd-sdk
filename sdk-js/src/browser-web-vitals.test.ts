import { beforeEach, describe, expect, it, vi } from "vitest";
import { startWebVitals } from "./browser-web-vitals";

type FakeEntry = Partial<PerformanceEntry> & Record<string, unknown>;

/** A PerformanceObserver stand-in that lets a test deliver entries by type. */
class FakePerformanceObserver {
  static supportedEntryTypes: string[] = [];
  static observers: FakePerformanceObserver[] = [];
  type = "";
  disconnected = false;

  constructor(private readonly callback: (list: { getEntries: () => FakeEntry[] }) => void) {
    FakePerformanceObserver.observers.push(this);
  }

  observe(options: { type: string }): void {
    this.type = options.type;
  }

  disconnect(): void {
    this.disconnected = true;
  }

  static emit(type: string, entries: FakeEntry[]): void {
    for (const observer of FakePerformanceObserver.observers) {
      if (observer.type === type && !observer.disconnected) {
        observer.callback({ getEntries: () => entries });
      }
    }
  }
}

const allEntryTypes = ["largest-contentful-paint", "paint", "layout-shift", "event", "first-input"];

beforeEach(() => {
  vi.unstubAllGlobals();
  FakePerformanceObserver.observers = [];
  FakePerformanceObserver.supportedEntryTypes = allEntryTypes;
  vi.stubGlobal("PerformanceObserver", FakePerformanceObserver);
  vi.stubGlobal("document", { visibilityState: "visible" });
  vi.stubGlobal("performance", {
    getEntriesByType: (type: string) => (type === "navigation" ? [{ responseStart: 180.4, activationStart: 0 }] : []),
  });
});

describe("startWebVitals", () => {
  it("reports LCP, INP, CLS, FCP and TTFB from observed entries", () => {
    const vitals = startWebVitals();

    FakePerformanceObserver.emit("paint", [{ name: "first-contentful-paint", startTime: 900.6 }]);
    FakePerformanceObserver.emit("largest-contentful-paint", [{ startTime: 1200 }, { startTime: 2450.2 }]);
    FakePerformanceObserver.emit("layout-shift", [
      { startTime: 100, value: 0.05, hadRecentInput: false },
      { startTime: 400, value: 0.04, hadRecentInput: false },
      { startTime: 450, value: 0.5, hadRecentInput: true },
      { startTime: 3000, value: 0.02, hadRecentInput: false },
    ]);
    FakePerformanceObserver.emit("event", [
      { interactionId: 7, duration: 120 },
      { interactionId: 7, duration: 180 },
      { interactionId: 9, duration: 64 },
      { interactionId: 0, duration: 900 },
    ]);

    expect(vitals.snapshot()).toEqual({ lcp: 2450, fcp: 901, cls: 0.09, inp: 180, ttfb: 180 });
  });

  it("omits a metric the visit never produced instead of reporting zero", () => {
    FakePerformanceObserver.supportedEntryTypes = ["largest-contentful-paint", "event"];
    vi.stubGlobal("performance", { getEntriesByType: () => [] });
    const vitals = startWebVitals();

    FakePerformanceObserver.emit("largest-contentful-paint", [{ startTime: 800 }]);

    expect(vitals.snapshot()).toEqual({ lcp: 800 });
  });

  it("drops paint timings for a page that loaded hidden and stops observing", () => {
    vi.stubGlobal("document", { visibilityState: "hidden" });
    const vitals = startWebVitals();

    FakePerformanceObserver.emit("largest-contentful-paint", [{ startTime: 800 }]);
    vitals.stop();
    FakePerformanceObserver.emit("event", [{ interactionId: 3, duration: 300 }]);

    expect(vitals.snapshot()).toEqual({ cls: 0, ttfb: 180 });
    expect(FakePerformanceObserver.observers.every((observer) => observer.disconnected)).toBe(true);
  });

  it("reports nothing where the browser has no PerformanceObserver", () => {
    vi.stubGlobal("PerformanceObserver", undefined);
    vi.stubGlobal("performance", undefined);

    expect(startWebVitals().snapshot()).toEqual({});
  });
});
