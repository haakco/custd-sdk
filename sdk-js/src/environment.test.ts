import { describe, expect, it, vi } from "vitest";
import { applyEnvironmentLabel, CustdClient, validateEnvironmentValue } from "./index.js";

function client(environment?: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return {
    fetchMock,
    client: new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", environment }),
  };
}

// Without batching the client posts one envelope; with batching it posts a
// batch. Both shapes carry the same label.
async function sentLabels(fetchMock: ReturnType<typeof vi.fn>) {
  const calls = fetchMock.mock.calls;
  const last = calls[calls.length - 1];
  const body = JSON.parse(String(last?.[1]?.body ?? "{}"));
  const envelope = body.events ? body.events[0] : body;
  return envelope.labels ?? {};
}

describe("declared environment", () => {
  it("carries the process default as the reserved label", async () => {
    const { client: custd, fetchMock } = client("development");
    await custd.track({
      eventTypeSlug: "page-view",
      schemaVersion: "1.0.0",
      timestamp: "2026-09-12T10:00:00Z",
      companySlug: "acme",
      context: { device: { type: "desktop" } },
      payload: {},
    });
    expect(await sentLabels(fetchMock)).toEqual({ "custd.environment": "development" });
  });

  it("lets an event override the process default", async () => {
    const { client: custd, fetchMock } = client("development");
    await custd.track({
      eventTypeSlug: "page-view",
      schemaVersion: "1.0.0",
      timestamp: "2026-09-12T10:00:00Z",
      companySlug: "acme",
      environment: "preview-pr-9",
      context: { device: { type: "desktop" } },
      payload: {},
    });
    expect(await sentLabels(fetchMock)).toEqual({ "custd.environment": "preview-pr-9" });
  });

  it("sends no environment label when nothing declares one", async () => {
    const { client: custd, fetchMock } = client();
    await custd.track({
      eventTypeSlug: "page-view",
      schemaVersion: "1.0.0",
      timestamp: "2026-09-12T10:00:00Z",
      companySlug: "acme",
      context: { device: { type: "desktop" } },
      payload: {},
    });
    expect(await sentLabels(fetchMock)).toEqual({});
  });

  it("rejects reserved and malformed declarations locally", () => {
    expect(() => validateEnvironmentValue("unclassified")).toThrow(/reserved/);
    expect(() => validateEnvironmentValue("Production")).toThrow(/lowercase/);
    expect(() => validateEnvironmentValue("staging_env")).toThrow(/lowercase/);
    expect(() => validateEnvironmentValue("preview-pr-9")).not.toThrow();
  });

  it("keeps a label the caller already set", () => {
    const event = {
      eventTypeSlug: "page-view",
      schemaVersion: "1.0.0",
      timestamp: "2026-09-12T10:00:00Z",
      context: {},
      payload: {},
      labels: { "custd.environment": "production" },
    };
    applyEnvironmentLabel(event, "development");
    expect(event.labels["custd.environment"]).toBe("production");
  });
});
