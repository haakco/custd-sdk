import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_ITEM_ERROR_CODES,
  type AppItemError,
  type AppItemRead,
  AppItemsClient,
  appItemOwnerUrl,
  appItemShareUrl,
  parseAppItemLink,
} from "./app-items";
import { APP_LIVE_STATUSES, type AppLiveState } from "./app-live";

const API = "https://api.custd.com";
const SITE_KEY = `site_pk_${"a".repeat(32)}`;
const OWNER = "o".repeat(43);
const SHARE = "s".repeat(43);
const ITEM_UUID = "11111111-2222-4333-8444-555555555555";

function itemRead(version: number): AppItemRead {
  return {
    item: {
      itemUuid: ITEM_UUID,
      kind: "measurement_project",
      role: "share",
      ownership: "unowned",
      version,
      idleExpirySeconds: 604800,
      updatedAt: "2026-11-17T10:00:00Z",
      expiresAt: "2026-11-24T10:00:00Z",
    },
  };
}

function json(body: unknown, status = 200, etag?: string): Response {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (etag) headers.etag = etag;
  return new Response(JSON.stringify(body), { status, headers });
}

function notModified(etag: string): Response {
  return new Response(null, { status: 304, headers: { etag } });
}

type Answer = () => Response | Promise<Response>;

function fakeFetch(...answers: Answer[]) {
  const queue = [...answers];
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    const next = queue.shift();
    if (!next) throw new Error("unexpected request");
    return next();
  });
}

function client(fetchMock: ReturnType<typeof fakeFetch>) {
  return new AppItemsClient({ apiBaseUrl: `${API}/`, siteKey: SITE_KEY, fetch: fetchMock as unknown as typeof fetch });
}

function last<T>(values: T[]): T | undefined {
  return values[values.length - 1];
}

function sent(fetchMock: ReturnType<typeof fakeFetch>, index: number) {
  const [url, init] = fetchMock.mock.calls[index] ?? [];
  return { url: String(url), init: init ?? {}, headers: (init?.headers ?? {}) as Record<string, string> };
}

describe("AppItemsClient", () => {
  it("sends only the preflight's headers, with the link token only in Authorization", async () => {
    const fetchMock = fakeFetch(() => json({ importId: "i", accepted: 1, rejected: 0, results: [] }));
    await client(fetchMock).addMeasurements(OWNER, { rows: [{ observedAt: "2026-11-17T10:00:00Z", value: 3 }] });

    const request = sent(fetchMock, 0);
    expect(request.url).toBe(`${API}/api/v1/app/item/measurements`);
    expect(request.headers).toEqual({
      "X-Custd-Site-Key": SITE_KEY,
      Authorization: `Bearer ${OWNER}`,
      "Content-Type": "application/json",
    });
    expect(request.init).toMatchObject({ method: "POST", credentials: "omit", cache: "no-store" });
    expect(JSON.parse(String(request.init.body))).toEqual({
      rows: [{ observedAt: "2026-11-17T10:00:00Z", value: 3 }],
    });
  });

  it("creates with the Site key alone and sends bodyless and body-required calls correctly", async () => {
    const created = { item: itemRead(1), ownerToken: OWNER, shareToken: SHARE };
    const fetchMock = fakeFetch(
      () => json(created, 201),
      () => json(itemRead(2)),
      () => json({ forecastRunUuid: "r" }),
      () => new Response(null, { status: 204 }),
    );
    const items = client(fetchMock);

    expect(await items.createItem({ kind: "link_collection" })).toEqual(created);
    await items.cancel(OWNER);
    await items.runForecast(OWNER);
    await items.removeEntry(OWNER, "entry/1");

    expect(sent(fetchMock, 0).headers.Authorization).toBeUndefined();
    expect(sent(fetchMock, 1).init.body).toBeUndefined();
    expect(sent(fetchMock, 1).headers["Content-Type"]).toBeUndefined();
    expect(sent(fetchMock, 2).url).toBe(`${API}/api/v1/app/forecast/runs`);
    expect(sent(fetchMock, 2).init.body).toBe("{}");
    expect(sent(fetchMock, 3)).toMatchObject({
      url: `${API}/api/v1/app/item/entries/entry%2F1`,
      init: { method: "DELETE" },
    });
  });

  it("reads conditionally inside a collection and reports 304 as not modified", async () => {
    const etag = `"${ITEM_UUID}.2.share"`;
    const fetchMock = fakeFetch(
      () => json(itemRead(2), 200, etag),
      () => notModified(etag),
    );
    const items = client(fetchMock);

    expect(await items.readItem(SHARE, { item: ITEM_UUID })).toEqual({ status: "modified", data: itemRead(2), etag });
    expect(await items.readItem(SHARE, { item: ITEM_UUID, etag })).toEqual({ status: "not_modified", etag });
    expect(sent(fetchMock, 1).url).toBe(`${API}/api/v1/app/item?item=${ITEM_UUID}`);
    expect(sent(fetchMock, 1).headers["If-None-Match"]).toBe(etag);
  });

  it("throws a typed problem error that never carries the token", async () => {
    const fetchMock = fakeFetch(
      () => json({ status: 403, title: "Forbidden", code: "app_link_read_only" }, 403),
      () => Promise.reject(new TypeError("Failed to fetch")),
    );
    const items = client(fetchMock);

    const refused = await items.complete(SHARE, { completedAt: "2026-11-17T10:00:00Z" }).catch((error) => error);
    expect(refused).toMatchObject({ status: 403, code: APP_ITEM_ERROR_CODES.readOnlyLink, terminal: true });
    expect(String(refused.message)).not.toContain(SHARE);

    const offline = await items.readItem(SHARE).catch((error) => error);
    expect(offline).toMatchObject({ status: null, code: APP_ITEM_ERROR_CODES.network, terminal: false });
  });
});

describe("AppItemsClient for a signed-in user", () => {
  const USER = "user-access-token";
  const signedIn = (fetchMock: ReturnType<typeof fakeFetch>) =>
    new AppItemsClient({
      apiBaseUrl: API,
      siteKey: SITE_KEY,
      fetch: fetchMock as unknown as typeof fetch,
      userToken: () => USER,
    });

  it("sends the user token beside the link, alone for an owned item, and lists my items", async () => {
    const fetchMock = fakeFetch(
      () => json(itemRead(2)),
      () => json(itemRead(2)),
      () => json({ items: [] }),
    );
    const items = signedIn(fetchMock);

    await items.claim(OWNER);
    await items.cancel({ item: ITEM_UUID });
    expect(await items.listMyItems()).toEqual({ items: [] });

    expect(sent(fetchMock, 0)).toMatchObject({ url: `${API}/api/v1/app/item/claim` });
    expect(sent(fetchMock, 0).headers).toMatchObject({ Authorization: `Bearer ${OWNER}`, "X-Custd-User-Token": USER });
    expect(sent(fetchMock, 1).url).toBe(`${API}/api/v1/app/item/cancel?item=${ITEM_UUID}`);
    expect(sent(fetchMock, 1).headers).toEqual({ "X-Custd-Site-Key": SITE_KEY, "X-Custd-User-Token": USER });
    expect(sent(fetchMock, 2)).toMatchObject({ url: `${API}/api/v1/app/items`, init: { method: "GET" } });
    expect(sent(fetchMock, 2).headers.Authorization).toBeUndefined();
  });

  it("tells a refused sign-in apart from a check to retry and a claimed item", async () => {
    const fetchMock = fakeFetch(
      () => json({ status: 401, code: "app_user_refused" }, 401),
      () => json({ status: 503, code: "app_user_check_unavailable" }, 503),
      () => json({ status: 409, code: "app_item_claimed" }, 409),
    );
    const items = signedIn(fetchMock);

    const refused = await items.listMyItems().catch((error) => error);
    const unchecked = await items.listMyItems().catch((error) => error);
    const claimed = await items.claim(OWNER).catch((error) => error);

    expect(refused).toMatchObject({ code: APP_ITEM_ERROR_CODES.userRefused, signInNeeded: true, terminal: true });
    expect(unchecked).toMatchObject({ signInNeeded: false, terminal: false });
    expect(claimed).toMatchObject({ code: APP_ITEM_ERROR_CODES.claimed, terminal: true });
    expect(String(refused.message)).not.toContain(USER);
  });
});

describe("model calculations", () => {
  it("calculates with any link, stores nothing, and reports the rate limit", async () => {
    const result = { modelUuid: "m", versionNumber: 2, seed: 1, sampleCount: 1000, quantities: [] };
    const fetchMock = fakeFetch(
      () => json(result),
      () => json({ status: 429, code: "app_model_calculate_limited" }, 429),
    );
    const items = client(fetchMock);
    const request = {
      versionNumber: 2,
      inputs: [{ name: "price", input: { shape: "point" as const, value: 3 } }],
      outputs: ["total"],
    };

    expect(await items.calculateModel(SHARE, request)).toEqual(result);
    expect(sent(fetchMock, 0)).toMatchObject({ url: `${API}/api/v1/app/models/calculate`, init: { method: "POST" } });
    expect(JSON.parse(String(sent(fetchMock, 0).init.body))).toEqual(request);
    const limited = await items.calculateModel(SHARE, request).catch((error) => error);
    expect(limited).toMatchObject({ status: 429, code: "app_model_calculate_limited", terminal: false });
  });
});

describe("app item links", () => {
  it("builds owner and share URLs and parses them, or a bare token, back", () => {
    const parts = { host: "counter.apps.custd.com", kindPath: "c" };
    const owner = appItemOwnerUrl({ ...parts, token: OWNER });
    const share = appItemShareUrl({ ...parts, token: SHARE });

    expect(owner).toBe(`https://counter.apps.custd.com/edit/c#${OWNER}`);
    expect(share).toBe(`https://counter.apps.custd.com/c/${SHARE}`);
    expect(parseAppItemLink(` ${owner} `)).toEqual({ token: OWNER, role: "owner", kindPath: "c" });
    expect(parseAppItemLink(share)).toEqual({ token: SHARE, role: "share", kindPath: "c" });
    expect(parseAppItemLink(SHARE)).toEqual({ token: SHARE });
    expect(parseAppItemLink("https://counter.apps.custd.com/c/short")).toBeNull();
    expect(parseAppItemLink("not a link")).toBeNull();
  });
});

describe("watched reads", () => {
  let document: EventTarget & { hidden: boolean };

  beforeEach(() => {
    vi.useFakeTimers();
    document = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("document", document);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function setHidden(hidden: boolean) {
    document.hidden = hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  }

  function record<T>(watch: { getState: () => AppLiveState<T>; subscribe: (l: () => void) => () => void }) {
    const states: AppLiveState<T>[] = [];
    const unsubscribe = watch.subscribe(() => states.push(watch.getState()));
    return { states, unsubscribe };
  }

  it("polls with If-None-Match, keeps data on 304, and shares one poller per item and link", async () => {
    const etag = `"${ITEM_UUID}.1.share"`;
    const fetchMock = fakeFetch(
      () => json(itemRead(1), 200, etag),
      () => notModified(etag),
    );
    const items = client(fetchMock);
    const first = record(items.watchItem(SHARE));
    const second = record(items.watchItem(SHARE));

    await vi.advanceTimersByTimeAsync(0);
    expect(last(first.states)).toMatchObject({ status: APP_LIVE_STATUSES.fresh, data: itemRead(1) });
    const firstConfirmed = (last(first.states) as { lastUpdatedAt: Date }).lastUpdatedAt;

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sent(fetchMock, 1).headers["If-None-Match"]).toBe(etag);
    const latest = last(second.states) as { status: string; data: AppItemRead; lastUpdatedAt: Date };
    expect(latest).toMatchObject({ status: APP_LIVE_STATUSES.fresh, data: itemRead(1) });
    expect(latest.lastUpdatedAt.getTime()).toBeGreaterThan(firstConfirmed.getTime());

    first.unsubscribe();
    second.unsubscribe();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("pauses while the tab is hidden and polls at once when it is shown", async () => {
    const fetchMock = fakeFetch(
      () => json(itemRead(1)),
      () => json(itemRead(2)),
    );
    const watched = record(client(fetchMock).watchItem(SHARE));
    await vi.advanceTimersByTimeAsync(0);

    setHidden(true);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(last(watched.states)).toMatchObject({ status: APP_LIVE_STATUSES.fresh, data: itemRead(2) });
    watched.unsubscribe();
  });

  it("goes stale or offline with backoff, and stops on a refused link", async () => {
    const fetchMock = fakeFetch(
      () => json(itemRead(1)),
      () => json({ code: "boom" }, 503),
      () => Promise.reject(new TypeError("Failed to fetch")),
      () => json({ status: 404, code: "app_link_refused" }, 404),
    );
    const watched = record(client(fetchMock).watchItem(SHARE));
    const status = () => last(watched.states)?.status;

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(last(watched.states)).toMatchObject({ status: APP_LIVE_STATUSES.stale, data: itemRead(1) });

    await vi.advanceTimersByTimeAsync(9999);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(status()).toBe(APP_LIVE_STATUSES.offline);

    await vi.advanceTimersByTimeAsync(20_000);
    expect(last(watched.states)).toMatchObject({
      status: APP_LIVE_STATUSES.error,
      retrying: false,
      data: itemRead(1),
      error: { code: APP_ITEM_ERROR_CODES.linkRefused },
    });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    watched.unsubscribe();
  });

  it("treats a missing forecast as empty, and refreshes watchers after a write through the link", async () => {
    const run = { forecastRunUuid: "r1" };
    const fetchMock = fakeFetch(
      () => json({ status: 404, code: "app_forecast_missing" }, 404, `"${ITEM_UUID}.1.owner"`),
      () => json(run),
      () => json(run, 200, `"${ITEM_UUID}.2.owner"`),
    );
    const items = client(fetchMock);
    const watched = record(items.watchLatestForecast(OWNER));

    await vi.advanceTimersByTimeAsync(0);
    expect(last(watched.states)).toMatchObject({ status: APP_LIVE_STATUSES.empty });

    await items.runForecast(OWNER);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sent(fetchMock, 2).headers["If-None-Match"]).toBeUndefined();
    expect(last(watched.states)).toMatchObject({ status: APP_LIVE_STATUSES.fresh, data: run });
    watched.unsubscribe();
  });

  it("does not reschedule after a request that finishes hidden or unwatched", async () => {
    let answer: (response: Response) => void = () => {};
    const pending = () =>
      new Promise<Response>((resolve) => {
        answer = resolve;
      });
    const fetchMock = fakeFetch(pending, pending, () => json(itemRead(3)));
    const watch = client(fetchMock).watchItem(SHARE);

    let watched = record(watch);
    setHidden(true);
    answer(json(itemRead(1)));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setHidden(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    watched.unsubscribe();
    answer(json(itemRead(2)));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    watched = record(watch);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(last(watched.states)).toMatchObject({ status: APP_LIVE_STATUSES.fresh, data: itemRead(3) });
    watched.unsubscribe();
  });

  it("reports an error before any data and keeps retrying", async () => {
    const fetchMock = fakeFetch(
      () => json({ code: "boom" }, 500),
      () => json(itemRead(1)),
    );
    const watched = record(client(fetchMock).watchItem(SHARE));

    await vi.advanceTimersByTimeAsync(0);
    const failed = last(watched.states) as { status: string; retrying: boolean; error: AppItemError };
    expect(failed).toMatchObject({ status: APP_LIVE_STATUSES.error, retrying: true });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(last(watched.states)).toMatchObject({ status: APP_LIVE_STATUSES.fresh });
    watched.unsubscribe();
  });
});
