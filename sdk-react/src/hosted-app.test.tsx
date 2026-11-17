import { HOSTED_APP_ERROR_CODES, type HostedApp, HostedAppError, type HostedAppStart } from "@haakco/custd-sdk/browser";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CustdHostedAppProvider, useCustdHostedApp, watchHostedApp } from "./hosted-app.js";

function readyStart(stop: () => void): HostedAppStart {
  const app = { stop, problems: [] } as unknown as HostedApp;
  return { status: "ready", app };
}

function Status() {
  return <p>{useCustdHostedApp().status}</p>;
}

describe("CustdHostedAppProvider", () => {
  it("renders children in the loading state before discovery resolves", () => {
    const html = renderToStaticMarkup(
      <CustdHostedAppProvider>
        <Status />
      </CustdHostedAppProvider>,
    );

    expect(html).toBe("<p>loading</p>");
  });

  it("refuses the hook outside the provider", () => {
    expect(() => renderToStaticMarkup(<Status />)).toThrow("inside CustdHostedAppProvider");
  });
});

describe("watchHostedApp", () => {
  it("reports the result and stops the app on cleanup", async () => {
    const stop = vi.fn();
    const onResult = vi.fn();
    const cleanup = watchHostedApp(async () => readyStart(stop), onResult);
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledOnce());

    cleanup();

    await vi.waitFor(() => expect(stop).toHaveBeenCalledOnce());
  });

  it("stops an app that resolves after cleanup without reporting it", async () => {
    const stop = vi.fn();
    const onResult = vi.fn();
    let resolve: (result: HostedAppStart) => void = () => undefined;
    const cleanup = watchHostedApp(() => new Promise((done) => (resolve = done)), onResult);

    cleanup();
    resolve(readyStart(stop));

    await vi.waitFor(() => expect(stop).toHaveBeenCalledOnce());
    expect(onResult).not.toHaveBeenCalled();
  });

  it("reports a typed discovery error", async () => {
    const onResult = vi.fn();
    const error = new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "discovery file returned 404");
    watchHostedApp(async () => ({ status: "error", error }), onResult);

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith({ status: "error", error }));
  });
});
