import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppItemsClient } from "./app-items";
import {
  APP_EVENT_OUTCOMES,
  HOSTED_APP_CAPABILITIES,
  HOSTED_APP_ERROR_CODES,
  HOSTED_APP_STATUSES,
  type HostedApp,
  type HostedAppStart,
  startHostedApp,
} from "./hosted-app";

const ORIGIN = "https://counter.apps.custd.com";
const API = "https://api.custd.com";
const BROWSER_KEY = `site_pk_${"a".repeat(32)}`;
const SITE_UUID = "11111111-2222-4333-8444-555555555555";

const signInBlock = {
  issuer: "https://auth.custd.com/",
  authorizationEndpoint: "https://auth.custd.com/oauth2/auth",
  tokenEndpoint: "https://auth.custd.com/oauth2/token",
  clientId: "app-client",
  audience: "https://api.custd.com",
  redirectUri: `${ORIGIN}/callback`,
};

function discovery(overrides: Record<string, unknown> = {}) {
  return {
    apiBaseUrl: API,
    host: "counter.apps.custd.com",
    siteUuid: SITE_UUID,
    browserKey: BROWSER_KEY,
    environment: "prod",
    capabilities: ["tracking", "error_capture", "sign_in", "app_data"],
    signIn: signInBlock,
    ...overrides,
  };
}

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function routes(document: unknown, identityMode: "cookieless" | "extended" = "cookieless") {
  const route: Route = (url, init) => {
    if (url.endsWith("/.well-known/custd.json")) return json(document);
    if (url.endsWith(`/api/v1/sites/${SITE_UUID}/config`)) return json({ identityMode, allowedOrigins: [ORIGIN] });
    if (url.endsWith("/api/v1/collect/events")) {
      return json({ success: true, eventUuid: JSON.parse(String(init?.body)).eventUuid }, 202);
    }
    if (url.includes("/api/v1/errors/")) return json({}, 200);
    return json({}, 404);
  };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => route(String(input), init));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function readyApp(result: HostedAppStart): HostedApp {
  if (result.status !== HOSTED_APP_STATUSES.ready) throw new Error(`expected ready, got ${result.error.code}`);
  return result.app;
}

function collected(fetchMock: ReturnType<typeof routes>) {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith("/api/v1/collect/events"))
    .map(([, init]) => JSON.parse(String(init?.body)));
}

beforeEach(() => {
  vi.restoreAllMocks();
  installBrowserGlobals();
});

describe("startHostedApp", () => {
  it("reads the page origin's discovery file and starts every enabled capability", async () => {
    const fetchMock = routes(discovery());

    const app = readyApp(await startHostedApp());
    await vi.waitFor(() => expect(collected(fetchMock)).toHaveLength(1));

    expect(String(fetchMock.mock.calls[0][0])).toBe(`${ORIGIN}/.well-known/custd.json`);
    expect(app.problems).toEqual([]);
    expect(app.tracker).toBeDefined();
    expect(app.errorCapture).toBeDefined();
    expect(app.signIn?.getState().status).toBe("signed_out");
    expect(app.appItems).toBeInstanceOf(AppItemsClient);
    const [pageView] = collected(fetchMock);
    expect(pageView.eventTypeSlug).toBe("page-view");
    expect(pageView.payload.siteUuid).toBe(SITE_UUID);
    expect(pageView.labels).toEqual({ "custd.environment": "prod" });
    app.stop();
  });

  it("sends a valid signed-in session's access token on app item calls, and none once it expired", async () => {
    const fetchMock = routes(discovery({ capabilities: ["sign_in", "app_data"] }));
    const session = (expiresAtMs: number) =>
      JSON.stringify({ accessToken: "user-access", tokenType: "bearer", expiresAtMs, scopes: ["openid"] });
    sessionStorage.setItem("custd:sign-in:app-client:session", session(Date.now() + 3_600_000));
    const app = readyApp(await startHostedApp());
    const userTokenOfLastCall = () => {
      const [, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] ?? [];
      return (init?.headers as Record<string, string> | undefined)?.["X-Custd-User-Token"];
    };

    await app.appItems?.listMyItems().catch(() => undefined);
    expect(userTokenOfLastCall()).toBe("user-access");

    sessionStorage.setItem("custd:sign-in:app-client:session", session(Date.now() - 1000));
    await app.appItems?.listMyItems().catch(() => undefined);
    expect(userTokenOfLastCall()).toBeUndefined();
    app.stop();
  });

  it("signs in with the discovery redirect URI", async () => {
    routes(discovery());

    const app = readyApp(await startHostedApp());
    const start = await app.signIn?.startSignIn();

    expect(new URL(start?.authorizationUrl ?? "").searchParams.get("redirect_uri")).toBe(`${ORIGIN}/callback`);
    app.stop();
  });

  it("starts only the capabilities the discovery file enables", async () => {
    const fetchMock = routes(discovery({ capabilities: ["error_capture", "future_capability"], signIn: undefined }));

    const app = readyApp(await startHostedApp());

    expect(app.discovery.capabilities).toEqual([HOSTED_APP_CAPABILITIES.errorCapture]);
    expect(app.tracker).toBeUndefined();
    expect(app.signIn).toBeUndefined();
    expect(app.appItems).toBeUndefined();
    expect(app.errorCapture).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(app.trackAppEvent("item-created", { kind: "counter" })).resolves.toBe(APP_EVENT_OUTCOMES.trackingOff);
  });

  it("waits for consent on an extended-identity Site", async () => {
    const fetchMock = routes(discovery({ capabilities: ["tracking"] }), "extended");

    const app = readyApp(await startHostedApp());
    await app.trackAppEvent("item-created", { kind: "counter" });

    expect(collected(fetchMock)).toEqual([]);
    app.stop();
  });

  it("starts tracking from the discovery file's Site config without fetching it", async () => {
    const fetchMock = routes(
      discovery({
        capabilities: ["tracking"],
        identityMode: "extended",
        allowedOrigins: [ORIGIN],
        pageViewSchemaVersion: "1.0.0",
      }),
      "cookieless",
    );

    const app = readyApp(await startHostedApp());
    await app.trackAppEvent("item-created", { kind: "counter" });

    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/config"))).toBe(false);
    expect(collected(fetchMock)).toEqual([]); // extended from discovery: waits for consent
    app.stop();
  });

  it("fetches the Site config when discovery lacks the page-view schema version", async () => {
    const fetchMock = routes(
      discovery({ capabilities: ["tracking"], identityMode: "extended", allowedOrigins: [ORIGIN] }),
    );

    readyApp(await startHostedApp()).stop();

    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith(`/api/v1/sites/${SITE_UUID}/config`))).toBe(true);
  });

  it("falls back to the Site config route when discovery lacks it", async () => {
    const fetchMock = routes(discovery({ capabilities: ["tracking"], identityMode: "extended" }));

    readyApp(await startHostedApp()).stop();

    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith(`/api/v1/sites/${SITE_UUID}/config`))).toBe(true);
  });

  it("sends typed app events through the tracker", async () => {
    type DoneWhenEvents = { "item-created": { kind: string; measurements: number } };
    const fetchMock = routes(discovery({ capabilities: ["tracking"] }));
    const result = await startHostedApp<DoneWhenEvents>();
    if (result.status !== HOSTED_APP_STATUSES.ready) throw new Error("expected ready");

    const outcome = await result.app.trackAppEvent("item-created", { kind: "counter", measurements: 3 });

    expect(outcome).toBe(APP_EVENT_OUTCOMES.tracked);
    const event = collected(fetchMock).find((item) => item.eventTypeSlug === "item-created");
    expect(event.payload).toMatchObject({ siteUuid: SITE_UUID, kind: "counter", measurements: 3 });
    result.app.stop();
  });

  it("returns a typed error state when discovery is missing or malformed", async () => {
    globalThis.fetch = vi.fn(async () => json({}, 404)) as unknown as typeof fetch;
    const missing = await startHostedApp();
    globalThis.fetch = vi.fn(async () => json({ apiBaseUrl: API })) as unknown as typeof fetch;
    const malformed = await startHostedApp();
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch;
    const offline = await startHostedApp();

    expect(missing).toMatchObject({ status: "error", error: { code: "discovery_unavailable", status: 404 } });
    expect(malformed).toMatchObject({ status: "error", error: { code: HOSTED_APP_ERROR_CODES.invalidDiscovery } });
    expect(offline).toMatchObject({ status: "error", error: { code: HOSTED_APP_ERROR_CODES.discoveryUnavailable } });
  });

  it("keeps the app running and reports a capability that cannot start", async () => {
    const fetchMock = routes(discovery({ capabilities: ["tracking", "sign_in"], signIn: undefined }));
    fetchMock.mockImplementation(async (input) =>
      String(input).endsWith("/.well-known/custd.json")
        ? json(discovery({ capabilities: ["tracking", "sign_in"], signIn: undefined }))
        : json({}, 503),
    );

    const app = readyApp(await startHostedApp());

    expect(app.tracker).toBeUndefined();
    expect(app.signIn).toBeUndefined();
    expect(app.problems.map((problem) => [problem.capability, problem.code])).toEqual([
      ["sign_in", HOSTED_APP_ERROR_CODES.capabilityFailed],
      ["tracking", HOSTED_APP_ERROR_CODES.siteConfigUnavailable],
    ]);
  });

  it("stop removes error capture and SPA tracking", async () => {
    routes(discovery({ capabilities: ["tracking", "error_capture"] }));
    const originalPushState = window.history.pushState;

    const app = readyApp(await startHostedApp());
    expect(window.history.pushState).not.toBe(originalPushState);
    app.stop();
    app.stop();

    expect(window.history.pushState).toBe(originalPushState);
    expect(listenerCount("error")).toBe(0);
    expect(listenerCount("unhandledrejection")).toBe(0);
  });
});

const listeners = new Map<string, Array<(event: Event) => void>>();

function listenerCount(type: string): number {
  return listeners.get(type)?.length ?? 0;
}

function installBrowserGlobals(): void {
  listeners.clear();
  const location = { href: `${ORIGIN}/`, origin: ORIGIN, pathname: "/", search: "", hash: "" };
  const history = {
    pushState: () => undefined,
    replaceState: () => undefined,
  };
  vi.stubGlobal("window", {
    location,
    history,
    addEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((item) => item !== listener),
      );
    },
  });
  vi.stubGlobal("document", { title: "", referrer: "" });
  vi.stubGlobal("navigator", { language: "en-US", userAgent: "Mozilla/5.0", onLine: true, doNotTrack: "0" });
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("sessionStorage", memoryStorage());
}

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}
