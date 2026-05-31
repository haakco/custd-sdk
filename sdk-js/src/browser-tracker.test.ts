import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserTracker, installBrowserTrackerFromScript } from "./browser-tracker";
import { validateBrowserEvent } from "./index";

const baseConfig = {
  baseUrl: "http://localhost:8087",
  siteUuid: "site-123",
  writeKey: "site_pk_test",
  allowedOrigins: ["https://example.com"],
};

beforeEach(() => {
  vi.restoreAllMocks();
  installBrowserGlobals();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "https://example.com/start");
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
});

describe("createBrowserTracker", () => {
  it("sends cookieless page views with empty browser identity fields", async () => {
    const fetchMock = mockFetch();
    document.title = "Start";

    const tracker = createBrowserTracker(baseConfig);
    await tracker.trackPageView();

    const sent = eventFromFetch(fetchMock);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8087/api/v1/collect/events");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer site_pk_test");
    expect(sent.eventTypeSlug).toBe("page-view");
    expect(sent.anonymousId).toBe("");
    expect(sent.sessionId).toBe("");
    expect(sent.companySlug).toBeUndefined();
    expect(sent.context.page?.path).toBe("/start");
    expect(sent.context.page?.title).toBe("Start");
  });

  it("stores extended identity only after consent is granted", async () => {
    const fetchMock = mockFetch();
    const tracker = createBrowserTracker({
      ...baseConfig,
      identityMode: "extended",
      consent: "required",
    });

    await tracker.track("signup-click", { plan: "pro" });
    expect(fetchMock).not.toHaveBeenCalled();

    tracker.setConsent("granted");
    await tracker.track("signup-click", { plan: "pro" });

    const sent = eventFromFetch(fetchMock);
    expect(sent.anonymousId).toMatch(/[0-9a-f-]{36}/);
    expect(sent.sessionId).toMatch(/[0-9a-f-]{36}/);
    expect(localStorage.getItem("custd:site-123:anonymous_id")).toBe(sent.anonymousId);
  });

  it("honors explicit consent requirement in cookieless mode", async () => {
    const fetchMock = mockFetch();
    const tracker = createBrowserTracker({ ...baseConfig, consent: "required" });

    await tracker.trackPageView();
    expect(fetchMock).not.toHaveBeenCalled();

    tracker.setConsent("granted");
    await tracker.trackPageView();
    expect(eventFromFetch(fetchMock).eventTypeSlug).toBe("page-view");
  });

  it("honors do-not-track in cookieless mode", async () => {
    const fetchMock = mockFetch();
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });

    const tracker = createBrowserTracker(baseConfig);
    await tracker.trackPageView();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to run outside the allowed origins", () => {
    expect(() =>
      createBrowserTracker({
        ...baseConfig,
        allowedOrigins: ["https://other.example"],
      }),
    ).toThrow(/origin is not allowed/);
  });

  it("tracks SPA navigation through history hooks", async () => {
    const fetchMock = mockFetch();
    const tracker = createBrowserTracker(baseConfig);

    tracker.installSpaTracking();
    window.history.pushState({}, "", "/next");
    await Promise.resolve();

    const sent = eventFromFetch(fetchMock);
    expect(sent.context.page?.path).toBe("/next");
  });

  it("flushes queued events when the batch size is reached", async () => {
    const fetchMock = mockFetch();
    const tracker = createBrowserTracker({ ...baseConfig, batchSize: 2 });

    await tracker.track("first", {});
    expect(fetchMock).not.toHaveBeenCalled();
    await tracker.track("second", {});

    const batch = batchFromFetch(fetchMock);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8087/api/v1/collect/events/batch");
    expect(batch.events.map((event: { eventTypeSlug: string }) => event.eventTypeSlug)).toEqual([
      "first",
      "second",
    ]);
  });

  it("uses sendBeacon on pagehide when available", async () => {
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    const tracker = createBrowserTracker({ ...baseConfig, batchSize: 10 });

    await tracker.track("queued", {});
    window.dispatchEvent(new Event("pagehide"));

    expect(beacon).toHaveBeenCalledOnce();
    expect(String(beacon.mock.calls[0][0])).toBe("http://localhost:8087/api/v1/collect/events/batch");
    const body = JSON.parse(await (beacon.mock.calls[0][1] as Blob).text());
    expect(body.writeKey).toBe("site_pk_test");
    expect(body.events[0].eventTypeSlug).toBe("queued");
  });

  it("flushes queued events when the browser comes back online", async () => {
    const fetchMock = mockFetch();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const tracker = createBrowserTracker({ ...baseConfig, batchSize: 10 });

    await tracker.track("offline-event", {});
    expect(fetchMock).not.toHaveBeenCalled();

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    window.dispatchEvent(new Event("online"));
    await Promise.resolve();

    expect(batchFromFetch(fetchMock).events[0].eventTypeSlug).toBe("offline-event");
  });

  it("persists offline queue entries in localStorage only when opted in", async () => {
    const fetchMock = mockFetch();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const tracker = createBrowserTracker({ ...baseConfig, batchSize: 10, persistentQueue: true });

    await tracker.track("offline-event", {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("custd:site-123:event_queue")).toContain("offline-event");
  });

  it("keeps cookieless queued events out of localStorage by default", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const tracker = createBrowserTracker({ ...baseConfig, batchSize: 10 });

    await tracker.track("offline-event", {});

    expect(localStorage.getItem("custd:site-123:event_queue")).toBeNull();
  });

  it("allows cookieless browser envelopes without company or identity IDs", () => {
    expect(() =>
      validateBrowserEvent({
        eventUuid: "event-1",
        eventTypeSlug: "page-view",
        schemaVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        anonymousId: "",
        sessionId: "",
        context: { device: { type: "desktop" } },
        payload: { siteUuid: "site-123" },
      }),
    ).not.toThrow();
  });

  it("installs script-tag tracker from site config and exposes the global API", async () => {
    const fetchMock = mockFetch([
      new Response(JSON.stringify({ identityMode: "cookieless", allowedOrigins: ["https://example.com"] }), {
        status: 200,
      }),
      new Response(JSON.stringify({ success: true }), { status: 202 }),
    ]);
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    await installBrowserTrackerFromScript();
    await window.custd.track("purchase", { amount: 12.99 });

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8087/api/v1/sites/site-123/config");
    expect(eventFromFetchCall(fetchMock, 1).eventTypeSlug).toBe("purchase");
  });

  it("queues global script calls before site config has loaded", async () => {
    let releaseConfig!: () => void;
    const configReady = new Promise<void>((resolve) => {
      releaseConfig = resolve;
    });
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/config")) {
        await configReady;
        return new Response(JSON.stringify({ identityMode: "cookieless", allowedOrigins: ["https://example.com"] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 202 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    const install = installBrowserTrackerFromScript();
    const queuedTrack = window.custd.track("queued-before-config", {});
    releaseConfig();
    await install;
    await queuedTrack;

    expect(eventFromFetchCall(fetchMock, 1).eventTypeSlug).toBe("queued-before-config");
  });

  it("requires consent before script-tag extended identity tracking", async () => {
    const fetchMock = mockFetch([
      new Response(JSON.stringify({ identityMode: "extended", allowedOrigins: ["https://example.com"] }), {
        status: 200,
      }),
      new Response(JSON.stringify({ success: true }), { status: 202 }),
    ]);
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    await installBrowserTrackerFromScript();
    await window.custd.track("extended-before-consent", {});
    expect(fetchMock).toHaveBeenCalledOnce();

    window.custd.setConsent("granted");
    await window.custd.track("extended-after-consent", {});
    expect(eventFromFetchCall(fetchMock, 1).eventTypeSlug).toBe("extended-after-consent");
  });

  it("does not let script attributes expand server allowed origins", async () => {
    const fetchMock = mockFetch([
      new Response(JSON.stringify({ identityMode: "cookieless", allowedOrigins: ["https://other.example"] }), {
        status: 200,
      }),
    ]);
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: {
          siteUuid: "site-123",
          writeKey: "site_pk_test",
          allowedTrackingDomain: "example.com",
        },
      },
      configurable: true,
    });

    await expect(installBrowserTrackerFromScript()).rejects.toThrow(/origin is not allowed/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects queued global calls when script startup fails", async () => {
    const fetchMock = mockFetch([new Response(JSON.stringify({ error: "missing site" }), { status: 404 })]);
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    const install = installBrowserTrackerFromScript();
    const queuedTrack = window.custd.track("queued-before-failure", {});

    await expect(install).rejects.toThrow(/site config request failed/);
    await expect(queuedTrack).rejects.toThrow(/site config request failed/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("bounds queued global calls while site config loads", async () => {
    let releaseConfig!: () => void;
    const configReady = new Promise<void>((resolve) => {
      releaseConfig = resolve;
    });
    const fetchMock = vi.fn(async () => {
      await configReady;
      return new Response(JSON.stringify({ identityMode: "cookieless", allowedOrigins: ["https://example.com"] }), {
        status: 200,
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    const install = installBrowserTrackerFromScript();
    const calls = Array.from({ length: 1001 }, (_, index) => window.custd.track(`queued-${index}`, {}));
    releaseConfig();

    await expect(calls[1000]).rejects.toThrow(/queued global call limit exceeded/);
    await install;
  });

  it("rejects non-local plaintext script collector URLs before config fetch", async () => {
    const fetchMock = mockFetch();
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://collector.example/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    await expect(installBrowserTrackerFromScript()).rejects.toThrow(/baseUrl must use https/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bounds the offline queue size", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const tracker = createBrowserTracker({
      ...baseConfig,
      batchSize: 10,
      persistentQueue: true,
      maxQueueSize: 2,
    });

    await tracker.track("first", {});
    await tracker.track("second", {});
    await tracker.track("third", {});

    const queued = JSON.parse(localStorage.getItem("custd:site-123:event_queue") ?? "[]");
    expect(queued.map((event: { eventTypeSlug: string }) => event.eventTypeSlug)).toEqual(["second", "third"]);
  });

  it("keeps the queue bounded when a flush fails while new events are queued", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const tracker = createBrowserTracker({
      ...baseConfig,
      batchSize: 10,
      persistentQueue: true,
      maxQueueSize: 2,
      retry: { maxAttempts: 1 },
    });
    await tracker.track("first", {});
    await tracker.track("second", {});

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const flush = tracker.flush();
    await tracker.track("third", {});
    await tracker.track("fourth", {});
    await expect(flush).rejects.toThrow(/network down/);

    const queued = JSON.parse(localStorage.getItem("custd:site-123:event_queue") ?? "[]");
    expect(queued).toHaveLength(2);
  });

  it("can reinstall SPA tracking after close", async () => {
    const fetchMock = mockFetch();
    const tracker = createBrowserTracker(baseConfig);

    tracker.installSpaTracking();
    tracker.close();
    tracker.installSpaTracking();
    window.history.pushState({}, "", "/after-reinstall");
    await Promise.resolve();

    expect(eventFromFetch(fetchMock).context.page?.path).toBe("/after-reinstall");
  });

  it("removes online and pagehide listeners on close", async () => {
    const fetchMock = mockFetch();
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const tracker = createBrowserTracker({ ...baseConfig, batchSize: 10 });
    await tracker.track("queued", {});

    tracker.close();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("pagehide"));
    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
  });

  it("replaces the queued script global with a rejecting API after bootstrap failure", async () => {
    mockFetch([new Response(JSON.stringify({ error: "missing" }), { status: 500 })]);
    Object.defineProperty(document, "currentScript", {
      value: {
        src: "http://localhost:8087/browser.js",
        dataset: { siteUuid: "site-123", writeKey: "site_pk_test", batchSize: "1" },
      },
      configurable: true,
    });

    await expect(installBrowserTrackerFromScript()).rejects.toThrow(/site config request failed/);
    const result = await Promise.race([
      window.custd.track("after-failure", {}).then(
        () => "resolved",
        () => "rejected",
      ),
      new Promise((resolve) => setTimeout(() => resolve("pending"), 0)),
    ]);

    expect(result).toBe("rejected");
  });
});

function mockFetch(responses?: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses ?? []) {
    fetchMock.mockResolvedValueOnce(response);
  }
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 202 }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function eventFromFetch(fetchMock: ReturnType<typeof vi.fn>) {
  return eventFromFetchCall(fetchMock, 0);
}

function eventFromFetchCall(fetchMock: ReturnType<typeof vi.fn>, callIndex: number) {
  return JSON.parse(fetchMock.mock.calls[callIndex][1].body as string);
}

function batchFromFetch(fetchMock: ReturnType<typeof vi.fn>) {
  return JSON.parse(fetchMock.mock.calls[0][1].body as string);
}

function installBrowserGlobals(): void {
  const listeners = new Map<string, Array<(event: Event) => void>>();
  const location = { href: "https://example.com/start", origin: "https://example.com", pathname: "/start" };
  const history = {
    pushState: (_state: unknown, _title: string, url?: string | URL | null) => {
      if (url) setLocation(location, url);
    },
    replaceState: (_state: unknown, _title: string, url?: string | URL | null) => {
      if (url) setLocation(location, url);
    },
  };
  const windowValue = {
    location,
    history,
    addEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(type, (listeners.get(type) ?? []).filter((item) => item !== listener));
    },
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event);
      }
      return true;
    },
  };

  vi.stubGlobal("window", windowValue);
  vi.stubGlobal("document", { title: "", referrer: "", currentScript: null });
  vi.stubGlobal("navigator", {
    language: "en-US",
    userAgent: "Mozilla/5.0",
    onLine: true,
    doNotTrack: "0",
  });
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("sessionStorage", memoryStorage());
}

declare global {
  interface Window {
    custd: {
      track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
      trackPageView: () => Promise<void>;
      setConsent: (state: "granted" | "denied") => void;
    };
  }
}

function setLocation(location: { href: string; origin: string; pathname: string }, url: string | URL): void {
  const next = new URL(String(url), location.href);
  location.href = next.href;
  location.origin = next.origin;
  location.pathname = next.pathname;
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
