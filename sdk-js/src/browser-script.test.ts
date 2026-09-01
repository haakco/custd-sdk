import { beforeEach, expect, it, vi } from "vitest";

const installSpaTracking = vi.fn();
const installBrowserTrackerFromScript = vi.fn(async () => ({ installSpaTracking }));

vi.mock("./browser-tracker.js", () => ({ installBrowserTrackerFromScript }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("document", {
    scripts: [{ src: "https://custd.example/browser-script.js" }],
  });
});

it("starts automatic pageview and SPA tracking after installing the script tracker", async () => {
  await import("./browser-script.js");
  await vi.waitFor(() => expect(installSpaTracking).toHaveBeenCalledOnce());
});

it("contains tracker initialization rejection", async () => {
  installBrowserTrackerFromScript.mockRejectedValueOnce(new Error("config unavailable"));

  await import(/* @vite-ignore */ `./browser-script.js?rejected-${Date.now()}`);
  await vi.waitFor(() => expect(installBrowserTrackerFromScript).toHaveBeenCalledOnce());
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(installSpaTracking).not.toHaveBeenCalled();
});
