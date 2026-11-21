import { defineConfig, devices } from "@playwright/test";

// With APP_URL set, the journey runs against that deployed app (scripts/walking-skeleton.sh sets it).
// Without it, the build is served locally and every Custd call goes to the SDK's in-memory fake.
const appUrl = process.env.APP_URL;
const previewUrl = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: { baseURL: appUrl ?? previewUrl, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(appUrl
    ? {}
    : {
        webServer: {
          command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4173 --strictPort",
          url: previewUrl,
          reuseExistingServer: false,
        },
      }),
});
