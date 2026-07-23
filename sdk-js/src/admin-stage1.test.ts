import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustdClient } from "./index";

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(responses: { status: number; body: string }[]): typeof fetch {
  const queue = [...responses];
  const fn = vi.fn(async () => {
    const next = queue.shift();
    if (!next) {
      throw new Error("unexpected fetch call");
    }
    return new Response(next.status === 204 ? null : next.body, {
      status: next.status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return fn as unknown as typeof fetch;
}

function newClient(fetchMock: typeof fetch): CustdClient {
  globalThis.fetch = fetchMock;
  return new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
  });
}

describe("admin privacy", () => {
  it("round-trips privacy rules and identifiers", async () => {
    const fetchMock = mockFetch([
      { status: 200, body: JSON.stringify({ tenantSlug: "acme", purposes: ["analytics"], hardDeleteAfterDays: 30 }) },
      {
        status: 200,
        body: JSON.stringify({
          tenantSlug: "acme",
          purposes: ["analytics", "product_improvement"],
          hardDeleteAfterDays: 60,
        }),
      },
      {
        status: 201,
        body: JSON.stringify({
          identifierId: "id-1",
          internalIdHash: "$2a$prefix",
          internalIdHashPrefix: "prefix",
          saltVersion: 2,
          createdAt: "2026-07-23T12:00:00Z",
        }),
      },
      {
        status: 200,
        body: JSON.stringify([
          { identifierId: "id-1", internalIdHash: "$2a$prefix", internalIdHashPrefix: "prefix", saltVersion: 2 },
        ]),
      },
    ]);
    const client = newClient(fetchMock);

    const rules = await client.admin.privacy.getRules();
    expect(rules.tenantSlug).toBe("acme");

    const updated = await client.admin.privacy.setRules({
      purposes: ["analytics", "product_improvement"],
      hardDeleteAfterDays: 60,
    });
    expect(updated.hardDeleteAfterDays).toBe(60);

    const mapped = await client.admin.privacy.mapIdentifier("acme", { externalId: "external-secret" });
    expect(mapped.internalIdHashPrefix).toBe("prefix");

    const list = await client.admin.privacy.listIdentifierMappings("acme");
    expect(list[0]?.identifierId).toBe("id-1");

    const urls = (fetchMock as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0]);
    expect(urls).toEqual([
      "http://localhost:8080/api/v1/admin/privacy/rules",
      "http://localhost:8080/api/v1/admin/privacy/rules",
      "http://localhost:8080/api/v1/admin/privacy/identifiers/acme/map",
      "http://localhost:8080/api/v1/admin/privacy/identifiers/acme",
    ]);
  });
});

describe("admin retention", () => {
  it("covers list, upsert, get, delete", async () => {
    const fetchMock = mockFetch([
      {
        status: 200,
        body: JSON.stringify({
          policies: [
            {
              tenantSlug: "acme",
              maxAgeDays: 365,
              hardDeleteAfterDays: 730,
              applyToEventTypes: ["page.view"],
              applyToDataSpaces: ["main"],
            },
          ],
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          tenantSlug: "acme",
          maxAgeDays: 180,
          hardDeleteAfterDays: 365,
          applyToEventTypes: [],
          applyToDataSpaces: [],
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          tenantSlug: "acme",
          maxAgeDays: 180,
          hardDeleteAfterDays: 365,
          applyToEventTypes: [],
          applyToDataSpaces: [],
        }),
      },
      { status: 204, body: "" },
    ]);
    const client = newClient(fetchMock);

    const list = await client.admin.retention.list();
    expect(list.policies[0]?.tenantSlug).toBe("acme");
    const upserted = await client.admin.retention.upsert("acme", {
      maxAgeDays: 180,
      hardDeleteAfterDays: 365,
    });
    expect(upserted.maxAgeDays).toBe(180);
    const got = await client.admin.retention.get("acme");
    expect(got.tenantSlug).toBe("acme");
    await client.admin.retention.delete("acme");
    const calls = (fetchMock as unknown as { mock: { calls: [string, { method?: string }][] } }).mock.calls;
    const urls = calls.map((c) => `${c[1]?.method ?? ""} ${c[0]}`);
    expect(urls).toEqual([
      "GET http://localhost:8080/api/v1/admin/retention/policies",
      "PUT http://localhost:8080/api/v1/admin/retention/policies/acme",
      "GET http://localhost:8080/api/v1/admin/retention/policies/acme",
      "DELETE http://localhost:8080/api/v1/admin/retention/policies/acme",
    ]);
  });
});

describe("admin storage alerts", () => {
  it("lists, creates, deletes tenant rules", async () => {
    const fetchMock = mockFetch([
      {
        status: 200,
        body: JSON.stringify({
          rules: [
            {
              ruleId: "rule-1",
              tenantSlug: "acme",
              metric: "ingest_bytes",
              thresholdPercent: 80,
              channel: "slack",
              enabled: true,
            },
          ],
        }),
      },
      {
        status: 201,
        body: JSON.stringify({
          ruleId: "rule-2",
          tenantSlug: "acme",
          metric: "ingest_bytes",
          thresholdPercent: 90,
          channel: "email",
          enabled: true,
        }),
      },
      { status: 204, body: "" },
    ]);
    const client = newClient(fetchMock);

    const list = await client.admin.storageAlerts.listRules("acme");
    expect(list.rules[0]?.ruleId).toBe("rule-1");
    const created = await client.admin.storageAlerts.createRule("acme", {
      metric: "ingest_bytes",
      thresholdPercent: 90,
      channel: "email",
      enabled: true,
    });
    expect(created.ruleId).toBe("rule-2");
    await client.admin.storageAlerts.deleteRule("acme", "rule-1");
  });
});

describe("admin audit", () => {
  it("lists events with query, fetches one event, lists reporting-pack events", async () => {
    const fetchMock = mockFetch([
      {
        status: 200,
        body: JSON.stringify({
          events: [
            {
              eventId: "ev-1",
              action: "create",
              actorId: "u-1",
              actorKind: "user",
              resourceType: "producer",
              resourceId: "prod-1",
              ipAddress: "10.0.0.1",
              createdAt: "2026-07-23T12:00:00Z",
            },
          ],
          nextCursor: { cursor: "next" },
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          eventId: "ev-1",
          action: "create",
          actorId: "u-1",
          actorKind: "user",
          resourceType: "producer",
          resourceId: "prod-1",
          ipAddress: "10.0.0.1",
          createdAt: "2026-07-23T12:00:00Z",
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          events: [
            {
              action: "draft_created",
              actorId: "u-1",
              resourceType: "reporting_pack",
              resourceId: "42",
              packKey: "security",
              createdAt: "2026-07-23T12:00:00Z",
            },
          ],
        }),
      },
    ]);
    const client = newClient(fetchMock);

    const events = await client.admin.audit.listEvents({
      resourceType: "producer",
      resourceId: "prod-1",
      limit: 50,
    });
    expect(events.nextCursor?.cursor).toBe("next");
    const one = await client.admin.audit.getEvent("ev-1");
    expect(one.eventId).toBe("ev-1");
    const rpEvents = await client.admin.audit.listReportingPackEvents();
    expect(rpEvents.events[0]?.packKey).toBe("security");
  });
});

describe("admin offboarding", () => {
  it("covers schedule, list, cancel, request lifecycle", async () => {
    const fetchMock = mockFetch([
      {
        status: 200,
        body: JSON.stringify({
          tenantSlug: "acme",
          effectiveAt: "2026-08-23T00:00:00Z",
          gracePeriodDays: 7,
          reason: "client request",
          status: "scheduled",
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          schedules: [
            {
              tenantSlug: "acme",
              effectiveAt: "2026-08-23T00:00:00Z",
              gracePeriodDays: 7,
              reason: "client request",
              status: "scheduled",
            },
          ],
        }),
      },
      { status: 204, body: "" },
      {
        status: 200,
        body: JSON.stringify({
          requestUuid: "req-1",
          tenantSlug: "acme",
          status: "pending",
          requestedBy: "u-1",
          requestedAt: "2026-07-23T12:00:00Z",
        }),
      },
      { status: 204, body: "" },
      { status: 204, body: "" },
    ]);
    const client = newClient(fetchMock);

    const scheduled = await client.admin.offboarding.schedule("acme", {
      effectiveAt: "2026-08-23T00:00:00Z",
      gracePeriodDays: 7,
      reason: "client request",
      status: "scheduled",
    });
    expect(scheduled.tenantSlug).toBe("acme");
    const list = await client.admin.offboarding.listSchedules();
    expect(list.schedules).toHaveLength(1);
    await client.admin.offboarding.cancelSchedule("acme", { reason: "client cancelled" });
    const req = await client.admin.offboarding.getRequest("req-1");
    expect(req.requestUuid).toBe("req-1");
    await client.admin.offboarding.cancelRequest("req-1");
    await client.admin.offboarding.confirmRequest("req-1");
  });
});

describe("admin reporting packs", () => {
  it("covers draft list/get/create/update, validate, preview, publish, restart, generation, status, rollback, rollup-provenance", async () => {
    const fetchMock = mockFetch([
      {
        status: 200,
        body: JSON.stringify({
          drafts: [
            {
              id: 42,
              revision: 1,
              definition: { key: "security", displayName: "Security", enabled: true, eventTypes: ["login.success"] },
            },
          ],
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          id: 42,
          revision: 1,
          definition: { key: "security", displayName: "Security", enabled: true, eventTypes: ["login.success"] },
        }),
      },
      {
        status: 201,
        body: JSON.stringify({
          id: 43,
          revision: 1,
          definition: { key: "security", displayName: "Security", enabled: true, eventTypes: ["login.success"] },
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          id: 43,
          revision: 2,
          definition: { key: "security", displayName: "Security v2", enabled: true, eventTypes: ["login.success"] },
        }),
      },
      { status: 200, body: JSON.stringify({ valid: true }) },
      {
        status: 200,
        body: JSON.stringify({
          value: { value: 1, unit: "count", sampleCount: 1, dataSufficiency: "complete", complete: true },
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          id: 99,
          generationNumber: 7,
          sourceDraftId: 43,
          definition: { key: "security", displayName: "Security" },
          state: "publishing",
          createdAt: "2026-07-23T12:00:00Z",
        }),
      },
      {
        status: 202,
        body: JSON.stringify({
          id: 100,
          generationNumber: 8,
          sourceDraftId: 43,
          definition: { key: "security", displayName: "Security" },
          state: "restarting",
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          id: 99,
          generationNumber: 7,
          sourceDraftId: 43,
          definition: { key: "security", displayName: "Security" },
          state: "published",
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          generation: { id: 99, generationNumber: 7, packKey: "security", state: "published" },
          acknowledgements: [
            { accepted: true, consumer: "tracklab", observedAt: "2026-07-23T12:00:00Z", observedGenerationId: 99 },
          ],
        }),
      },
      { status: 204, body: "" },
      {
        status: 200,
        body: JSON.stringify({
          generationId: 99,
          definitionFingerprint: "abc",
          tenantSlug: "acme",
          materializations: [{ status: "ready", definitionFingerprint: "abc", sourceCoverageCount: 12 }],
        }),
      },
    ]);
    const client = newClient(fetchMock);

    const drafts = await client.admin.reportingPacks.listDrafts();
    expect(drafts.drafts[0]?.id).toBe(42);
    const draft = await client.admin.reportingPacks.getDraft("42");
    expect(draft.id).toBe(42);
    const created = await client.admin.reportingPacks.createDraft({
      definition: { key: "security", displayName: "Security", enabled: true, eventTypes: ["login.success"] },
    });
    expect(created.id).toBe(43);
    const updated = await client.admin.reportingPacks.updateDraft("43", {
      definition: { key: "security", displayName: "Security v2", enabled: true, eventTypes: ["login.success"] },
      expectedRevision: 1,
    });
    expect(updated.revision).toBe(2);
    const validated = await client.admin.reportingPacks.validate({
      definition: { key: "security", displayName: "Security", enabled: true, eventTypes: [] },
    });
    expect(validated.valid).toBe(true);
    const previewed = await client.admin.reportingPacks.preview({
      definition: { key: "security", displayName: "Security", enabled: true, eventTypes: [] },
      tenantSlug: "acme",
      query: { template: "count", metrics: ["events"] },
    });
    expect(previewed.value.value).toBe(1);
    const published = await client.admin.reportingPacks.publish("43");
    expect(published.state).toBe("publishing");
    const restarted = await client.admin.reportingPacks.restart("43");
    expect(restarted.generationNumber).toBe(8);
    const got = await client.admin.reportingPacks.getGeneration("99");
    expect(got.state).toBe("published");
    const status = await client.admin.reportingPacks.getGenerationStatus("99");
    expect(status.generation.packKey).toBe("security");
    await client.admin.reportingPacks.rollbackGeneration("99");
    const provenance = await client.admin.reportingPacks.getRollupProvenance("99");
    expect(provenance.materializations[0]?.sourceCoverageCount).toBe(12);
  });
});

describe("admin oauth updateScopes + admin schema audit/validate/dryRun/enable", () => {
  it("PATCHes /scopes and round-trips schema action endpoints", async () => {
    const fetchMock = mockFetch([
      {
        status: 200,
        body: JSON.stringify({ clientId: "custd-acme", companySlug: "acme", scopes: ["events.write", "events.read"] }),
      },
      { status: 200, body: JSON.stringify({ valid: true, issues: [], suggestedAction: "register" }) },
      { status: 204, body: "" },
      { status: 200, body: JSON.stringify({ passed: 3, failed: 0, issues: [] }) },
      {
        status: 200,
        body: JSON.stringify({
          entries: [
            {
              eventId: "ev-1",
              eventTypeSlug: "courib.delivery.created",
              version: "1.0.0",
              action: "registered",
              registeredAt: "2026-07-23T12:00:00Z",
              registeredBy: "u-1",
            },
          ],
        }),
      },
    ]);
    const client = newClient(fetchMock);

    const updated = await client.admin.oauthClients.updateScopes("custd-acme", {
      profile: "standard",
      scopes: ["events.write", "events.read"],
    });
    // OAuthClient shape is deliberately write-key-free; assert it stays that way.
    expect(updated).not.toHaveProperty("clientSecret");

    const validated = await client.admin.schemas.validate({
      tenantSlug: "acme",
      eventTypeSlug: "courib.delivery.created",
      dialect: "jsonschema",
      schemaJson: "{}",
    });
    expect(validated.suggestedAction).toBe("register");

    await client.admin.schemas.enableVersion("acme", "courib.delivery.created", {
      tenantSlug: "acme",
      eventTypeSlug: "courib.delivery.created",
      version: "1.0.0",
    });
    const dryRun = await client.admin.schemas.dryRun("acme", "courib.delivery.created", {
      tenantSlug: "acme",
      eventTypeSlug: "courib.delivery.created",
      dialect: "jsonschema",
      schemaJson: "{}",
      samples: [],
    });
    expect(dryRun.passed).toBe(3);

    const audit = await client.admin.schemas.audit();
    expect(audit.entries[0]?.version).toBe("1.0.0");
  });
});

describe("provisioning reservations", () => {
  it("covers reserve, list, claim, release", async () => {
    const fetchMock = mockFetch([
      {
        status: 201,
        body: JSON.stringify({
          producerSlug: "webhook",
          parentCompanySlug: "acme",
          status: "reserved",
          reservedAt: "2026-07-23T12:00:00Z",
          expiresAt: "2026-07-23T12:05:00Z",
          maxTtlSeconds: 300,
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          reservations: [{ producerSlug: "webhook", parentCompanySlug: "acme", status: "reserved" }],
        }),
      },
      {
        status: 200,
        body: JSON.stringify({
          producerSlug: "webhook",
          parentCompanySlug: "acme",
          status: "claimed",
          claimedByClientId: "custd-acme-webhook",
        }),
      },
      { status: 204, body: "" },
    ]);
    const client = newClient(fetchMock);

    const reserved = await client.provisioning.reservations.reserve("acme", {
      producerSlug: "webhook",
      ttlSeconds: 300,
    });
    expect(reserved.status).toBe("reserved");
    const list = await client.provisioning.reservations.list("acme");
    expect(list.reservations[0]?.producerSlug).toBe("webhook");
    const claimed = await client.provisioning.reservations.claim("acme", "webhook", {
      claimedByClientId: "custd-acme-webhook",
    });
    expect(claimed.status).toBe("claimed");
    await client.provisioning.reservations.release("acme", "webhook");
  });
});
