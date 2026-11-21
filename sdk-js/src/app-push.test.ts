import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type AppItemRead, AppItemsClient } from "./app-items";
import { APP_LIVE_STATUSES, type AppLiveState } from "./app-live";
import { AppPushChannel, type AppWebSocket } from "./app-push";

const API = "https://api.custd.com";
const SITE_KEY = `site_pk_${"a".repeat(32)}`;
const SHARE = "s".repeat(43);
const ITEM_UUID = "11111111-2222-4333-8444-555555555555";

function read(version: number): AppItemRead {
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

function itemResponse(version: number): Response {
  const etag = `"${ITEM_UUID}.${version}.share.unowned"`;
  return new Response(JSON.stringify(read(version)), {
    status: 200,
    headers: { "content-type": "application/json", etag },
  });
}

/** A socket the test drives: it opens, delivers server frames and closes when told. */
class FakeSocket implements AppWebSocket {
  readyState = 0;
  onopen: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  readonly sent: Record<string, unknown>[] = [];

  constructor(readonly url: string) {}

  send(data: string): void {
    this.sent.push(JSON.parse(data) as Record<string, unknown>);
  }

  close(): void {
    this.readyState = 3;
  }

  open(): void {
    this.readyState = 1;
    this.onopen?.({});
  }

  receive(frame: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }

  drop(code: number): void {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

describe("pushed item changes", () => {
  let sockets: FakeSocket[];
  let fetchMock: ReturnType<typeof vi.fn>;
  let version: number;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("document", Object.assign(new EventTarget(), { hidden: false }));
    sockets = [];
    version = 1;
    fetchMock = vi.fn(async () => itemResponse(version));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function watch(userToken?: () => string | undefined) {
    const items = new AppItemsClient({
      apiBaseUrl: API,
      siteKey: SITE_KEY,
      fetch: fetchMock as unknown as typeof fetch,
      userToken,
      webSocket: (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
    });
    const watched = items.watchItem(SHARE);
    const states: AppLiveState<AppItemRead>[] = [];
    const stop = watched.subscribe(() => states.push(watched.getState()));
    return { states, stop, items };
  }

  /** Opens the newest socket, answers its hello and confirms its subscription. */
  async function connect(): Promise<FakeSocket> {
    const socket = sockets[sockets.length - 1] as FakeSocket;
    socket.open();
    socket.receive({ type: "ready", mode: "app", heartbeatSeconds: 25 });
    const subscribe = socket.sent.find((frame) => frame.type === "subscribe") as Record<string, unknown>;
    socket.receive({
      type: "subscribed",
      subscription: subscribe.subscription,
      itemUuid: ITEM_UUID,
      revision: version,
    });
    await vi.advanceTimersByTimeAsync(0);
    return socket;
  }

  it("polls only when a change is pushed, with the link in a frame and never in the URL", async () => {
    const { states, stop } = watch();
    const socket = await connect();
    expect(socket.url).toBe("wss://api.custd.com/api/v1/realtime");
    expect(socket.sent[0]).toEqual({ type: "hello", mode: "app", siteKey: SITE_KEY });
    expect(socket.sent[1]).toMatchObject({ type: "subscribe", linkToken: SHARE });
    const beforeIdle = fetchMock.mock.calls.length;

    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock.mock.calls.length).toBe(beforeIdle);
    // A slow safety poll still runs while pushed, so a socket gone quiet cannot hide a change.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock.mock.calls.length).toBe(beforeIdle + 1);

    version = 2;
    socket.receive({
      type: "item.changed",
      subscription: socket.sent[1]?.subscription,
      itemUuid: ITEM_UUID,
      revision: 2,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock.mock.calls.length).toBe(beforeIdle + 2);
    const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
    const headers = lastCall[1].headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBe(`"${ITEM_UUID}.1.share.unowned"`);
    expect(states[states.length - 1]).toMatchObject({ status: APP_LIVE_STATUSES.fresh, data: read(2) });
    stop();
  });

  it("falls back to polling while push is down and resumes it on reconnect", async () => {
    const { stop } = watch();
    const socket = await connect();
    const pushed = fetchMock.mock.calls.length;

    socket.drop(1006);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock.mock.calls.length).toBe(pushed + 1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock.mock.calls.length).toBe(pushed + 2);

    expect(sockets).toHaveLength(2);
    const resumed = await connect();
    expect(resumed.sent.filter((frame) => frame.type === "subscribe")).toHaveLength(1);
    const afterResume = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock.mock.calls.length).toBe(afterResume);
    stop();
  });

  it("keeps polling on its timer when the server refuses push", async () => {
    const { stop } = watch();
    const socket = sockets[0] as FakeSocket;
    socket.open();
    socket.drop(1008);
    await vi.advanceTimersByTimeAsync(0);
    const first = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock.mock.calls.length).toBe(first + 2);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sockets).toHaveLength(1);
    stop();
  });

  it("resubscribes with the signed-in user's new token after a refusal or a sign-in change", async () => {
    let token = "user-1";
    const { stop, items } = watch(() => token);
    const socket = await connect();
    const subscribes = () => socket.sent.filter((frame) => frame.type === "subscribe");
    token = "user-2";
    socket.receive({ type: "refused", subscription: subscribes()[0]?.subscription, code: "user_refused" });
    expect(subscribes().map((frame) => frame.userToken)).toEqual(["user-1", "user-2"]);
    token = "user-3";
    items.refreshAll();
    expect(socket.sent.slice(-2).map((frame) => frame.type)).toEqual(["unsubscribe", "subscribe"]);
    expect(subscribes().map((frame) => frame.userToken)).toEqual(["user-1", "user-2", "user-3"]);
    stop();
  });

  it("closes the socket when the last watched read stops", async () => {
    const { stop } = watch();
    const socket = await connect();
    stop();
    expect(socket.sent[socket.sent.length - 1]).toMatchObject({ type: "unsubscribe" });
    expect(socket.readyState).toBe(3);
  });

  it("waits a random part of the capped backoff before each reconnect", async () => {
    const channel = new AppPushChannel(
      "wss://api.custd.com/api/v1/realtime",
      SITE_KEY,
      (url) => {
        const socket = new FakeSocket(url);
        sockets.push(socket);
        return socket;
      },
      () => 0.5,
    );
    const stop = channel.watch(
      { linkToken: SHARE, userToken: () => undefined },
      { changed: () => {}, pushed: () => {} },
    );
    (sockets[0] as FakeSocket).drop(1006);
    await vi.advanceTimersByTimeAsync(499);
    expect(sockets).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(sockets).toHaveLength(2);
    (sockets[1] as FakeSocket).drop(1006);
    await vi.advanceTimersByTimeAsync(999);
    expect(sockets).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(sockets).toHaveLength(3);
    stop();
  });
});
