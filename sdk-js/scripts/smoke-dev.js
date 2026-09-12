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
  // A process-level default is enough: one credential serves every
  // environment, so sending from dev needs no extra provisioning. Override it
  // with CUSTD_DEV_ENVIRONMENT, or per event with the event's environment.
  const environment = process.env.CUSTD_DEV_ENVIRONMENT ?? "dev";
  const token = getToken();

  const client = new CustdClient({
    baseUrl,
    getToken: () => token,
    environment,
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

  console.log(`custd sdk js smoke OK environment=${environment}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
