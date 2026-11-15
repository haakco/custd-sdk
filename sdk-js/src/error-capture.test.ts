import { describe, expect, it, vi } from "vitest";
import { ErrorCaptureClient, installBrowserErrorCapture } from "./error-capture.js";

const config = {
  baseUrl: "https://errors.example.test",
  writeKey: `site_pk_${"a".repeat(48)}`,
  environment: "test",
  release: "awthy@1.0.14",
};

describe("native error capture", () => {
  it("sends only exception types and bounded code locations to Custd's error intake", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":"accepted"}'));
    const error = new TypeError("password=do-not-send");
    error.stack =
      "TypeError: password=do-not-send\n    at work (https://private.example.test/accounts/secret/worker.js?token=do-not-send:12:4)";
    Object.assign(error, { request: { cookie: "do-not-send" }, user: { email: "private@example.test" } });
    const client = new ErrorCaptureClient({ ...config, fetch: send });
    expect(await client.captureException({ error, correlationId: "01ARZ3NDEKTSV4RRFFQ69G5FAV" })).toEqual({
      outcome: "accepted",
      status: 200,
    });
    const [endpoint, request] = send.mock.calls[0];
    expect(endpoint).toBe("https://errors.example.test/api/v1/errors/api/1/envelope/");
    const body = String(request?.body);
    const [header, item, event] = body.split("\n").map((line) => JSON.parse(line));
    expect(header.dsn).toBe(`https://${config.writeKey}@errors.example.test/api/v1/errors/1`);
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
