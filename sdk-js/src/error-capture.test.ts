import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  createErrorCaptureEvent,
  ErrorCaptureClient,
  installBrowserErrorCapture,
  installNativeErrorCapture,
} from "./error-capture.js";
import { createEventId } from "./index.js";

const config = {
  baseUrl: "https://errors.example.test",
  writeKey: `site_pk_${"a".repeat(48)}`,
  environment: "test",
  release: "awthy@1.0.14",
};

describe("native error capture", () => {
  it("creates opaque event IDs without native Web Crypto", () => {
    vi.stubGlobal("crypto", undefined);
    try {
      const first = createEventId();
      expect(first).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u);
      expect(createEventId()).not.toBe(first);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("formats a mobile relay event without crypto or browser globals", () => {
    vi.stubGlobal("crypto", undefined);
    try {
      const error = new TypeError("private title");
      error.stack = [
        "TypeError: private title",
        "    at render (address at index.android.bundle:1:6301494)",
        "    at render (https://private.example/app/(tabs)/%5Bid%5D.tsx?token=do-not-send:1:6301494)",
        "    at render (https://private.example/private/+Page.tsx:12:4)",
      ].join("\n");
      expect(
        createErrorCaptureEvent({ error, mode: "unhandled" }, { environment: "production", release: "1.0.0" }),
      ).toEqual(
        JSON.parse(readFileSync(new URL("../../contract-fixtures/error-capture-relay.json", import.meta.url), "utf8")),
      );
      expect(() => createErrorCaptureEvent({ error }, { environment: "invalid environment" })).toThrow();
      expect(() => createErrorCaptureEvent({ error }, { environment: "test", eventId: "unsafe" })).toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rejects unsafe decoded basenames instead of retaining URL or credential content", () => {
    const error = new Error("private");
    error.stack = [
      "Error: private",
      ...["%2Fsecret.tsx", "%5Csecret.tsx", "%3Ftoken.tsx", "%40account.tsx", "%E0%A4%A.tsx"].map(
        (name) => `    at render (https://private.example/private/${name}:1:4)`,
      ),
    ].join("\n");
    expect(createErrorCaptureEvent({ error }, { environment: "test" }).frames).toEqual([]);
  });

  it("keeps signed-32-bit column locations while retaining the line bound", () => {
    const error = new Error("private");
    error.stack = "Error: private\n    at render (address at index.android.bundle:1000001:2147483648)";
    expect(createErrorCaptureEvent({ error }, { environment: "test" }).frames).toEqual([
      { filename: "index.android.bundle", lineno: 1000000, colno: 2147483647 },
    ]);
  });

  it("chains the native handler despite capture failure and restores only its own handler", async () => {
    const original = vi.fn();
    let handler: (error: unknown, fatal?: boolean) => void = original;
    const errors = {
      getGlobalHandler: () => handler,
      setGlobalHandler: (next: typeof handler) => {
        handler = next;
      },
    };
    const capture = vi.fn().mockRejectedValue(new Error("collector unavailable"));
    const close = installNativeErrorCapture(errors, capture);
    const error = new Error("private");
    handler(error, true);
    expect(capture).toHaveBeenCalledWith({ error, mode: "unhandled" });
    expect(original).toHaveBeenCalledWith(error, true);
    await Promise.resolve();
    close();
    expect(handler).toBe(original);
    const closeAgain = installNativeErrorCapture(errors, () => {
      throw new Error("unavailable");
    });
    expect(() => handler(error)).not.toThrow();
    const replacement = vi.fn();
    handler = replacement;
    closeAgain();
    expect(handler).toBe(replacement);
  });

  it.each([`site_pk_${"a".repeat(48)}`, `site_pk_${"Az_-".repeat(12)}`])(
    "sends only exception types and bounded code locations to Custd's error intake (%s)",
    async (writeKey) => {
      const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":"accepted"}'));
      const error = new TypeError("password=do-not-send");
      error.stack =
        "TypeError: password=do-not-send\n    at work (https://private.example.test/accounts/secret/worker.js?token=do-not-send:12:4)";
      Object.assign(error, { request: { cookie: "do-not-send" }, user: { email: "private@example.test" } });
      const client = new ErrorCaptureClient({ ...config, writeKey, fetch: send });
      expect(await client.captureException({ error, correlationId: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })).toEqual({
        outcome: "accepted",
        status: 200,
      });
      const [endpoint, request] = send.mock.calls[0];
      expect(endpoint).toBe("https://errors.example.test/api/v1/errors/api/1/envelope/");
      const body = String(request?.body);
      const [header, item, event] = body.split("\n").map((line) => JSON.parse(line));
      expect(header.dsn).toBe(`https://${writeKey}@errors.example.test/api/v1/errors/1`);
      expect(item).toEqual({ type: "event" });
      expect(event.exception.values).toEqual([
        {
          type: "TypeError",
          mechanism: { handled: true },
          stacktrace: { frames: [{ filename: "worker.js", lineno: 12, colno: 4 }] },
        },
      ]);
      expect(event.tags).toEqual({ correlation_id: "01ARZ3NDEKTSV4RRFFQ69G5FAV" });
      expect(event.sdk.name).toBe("custd.javascript");
      for (const forbidden of [
        "do-not-send",
        "private.example.test",
        "/accounts/",
        "private@example.test",
        "password",
        '"request"',
      ])
        expect(body).not.toContain(forbidden);
      expect(request).toMatchObject({ credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" });
    },
  );

  it("retains Hermes and Metro code locations without private paths or messages", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response());
    const error = new Error("private media title");
    error.stack = [
      "Error: private media title",
      "    at render (address at index.android.bundle:1:12345)",
      "render@http://localhost:8081/node_modules/expo-router/entry.bundle?platform=android&token=private:40:8",
      "    at render (/private/account/screens/Player.tsx:20:4)",
    ].join("\n");
    await new ErrorCaptureClient({ ...config, fetch: send }).captureException({ error });
    const event = JSON.parse(String(send.mock.calls[0][1]?.body).split("\n")[2]);
    expect(event.exception.values[0].stacktrace.frames).toEqual([
      { filename: "Player.tsx", lineno: 20, colno: 4 },
      { filename: "entry.bundle", lineno: 40, colno: 8 },
      { filename: "index.android.bundle", lineno: 1, colno: 12345 },
    ]);
    expect(String(send.mock.calls[0][1]?.body)).not.toContain("private");
  });

  it("isolates transport failures and caps repeated captures without retrying", async () => {
    const send = vi.fn<typeof fetch>().mockRejectedValue(new Error("private provider response"));
    const client = new ErrorCaptureClient({ ...config, fetch: send });
    for (let attempt = 0; attempt < 20; attempt += 1)
      expect(await client.captureException({ error: new Error("secret") })).toEqual({ outcome: "unavailable" });
    expect(await client.captureException({ error: new Error() })).toEqual({ outcome: "limited" });
    expect(send).toHaveBeenCalledTimes(20);
    expect(() => new ErrorCaptureClient({ ...config, baseUrl: "http://remote.example.test" })).toThrow(
      "invalid error capture configuration",
    );
  });

  it("installs an authenticated relay capture adapter without collector credentials", async () => {
    const browser = new EventTarget();
    vi.stubGlobal("window", browser);
    try {
      const captureException = vi
        .fn<ErrorCaptureClient["captureException"]>()
        .mockResolvedValue({ outcome: "unavailable" });
      const close = installBrowserErrorCapture({ captureException });
      const event = Object.assign(new Event("error"), { error: new Error("private") });
      browser.dispatchEvent(event);
      expect(captureException).toHaveBeenCalledWith({ error: event.error, mode: "unhandled" });
      close();
      browser.dispatchEvent(event);
      expect(captureException).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("captures unhandled browser failures without taking over the browser outcome, and detaches", async () => {
    const browser = new EventTarget();
    vi.stubGlobal("window", browser);
    try {
      const send = vi.fn<typeof fetch>().mockResolvedValue(new Response());
      const client = new ErrorCaptureClient({ ...config, fetch: send });
      const close = installBrowserErrorCapture(client);
      const event = Object.assign(new Event("unhandledrejection", { cancelable: true }), {
        reason: new Error("secret"),
      });
      browser.dispatchEvent(event);
      await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
      expect(event.defaultPrevented).toBe(false);
      close();
      browser.dispatchEvent(event);
      expect(send).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
