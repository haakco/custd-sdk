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
