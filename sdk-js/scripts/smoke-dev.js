import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { CustdClient } from "../dist/index.js";

function getToken() {
  const token = execSync("bash ../../scripts/dev-hydra-token.sh", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return token.trim();
}

async function run() {
  const baseUrl = process.env.CUSTD_DEV_BASE_URL ?? "http://localhost:8087";
  const companySlug = process.env.CUSTD_DEV_COMPANY_SLUG ?? "test-company";
  const token = getToken();

  const client = new CustdClient({
    baseUrl,
    getToken: () => token,
  });

  const response = await client.ingestEvent({
    eventUuid: randomUUID(),
    eventTypeSlug: "page-view",
    schemaVersion: "1.0.0",
    timestamp: new Date().toISOString(),
    sessionId: randomUUID(),
    anonymousId: randomUUID(),
    context: {
      page: { url: "https://example.com" },
      device: { type: "desktop" },
    },
    companySlug,
    payload: { source: "sdk-js-smoke" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`custd sdk js smoke failed: ${response.status} ${body}`);
  }

  console.log("custd sdk js smoke OK");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
