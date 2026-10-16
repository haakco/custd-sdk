import { describe, expect, it, vi } from "vitest";
import { CustdClient } from "./index";

function mockFetch(body: unknown, status = 200) {
  return vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
}

function client(fetchImpl: ReturnType<typeof mockFetch>) {
  return new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
}

// A canonical definition carrying every field the log-observability template
// emits plus several exotic contracted sections, so a lossy decode is visible.
const definition = {
  key: "log_observability",
  displayName: "Log observability",
  owner: "platform",
  version: 1,
  enabled: true,
  eventTypes: ["log_observability_event"],
  metrics: [{ key: "log_observability_volume", label: "Log volume", kind: "count", calculation: "count" }],
  dimensions: [
    { key: "log_observability_severity", label: "Severity", selector: "payload.severity" },
    { key: "log_observability_resource", label: "Resource", selector: "payload.resource" },
  ],
  templates: [
    {
      name: "log_observability_overview",
      allowedMetrics: [],
      sourceModes: ["auto"],
      maxRows: 250,
      eventTypes: [],
      aggregation: "count",
    },
  ],
  flowRules: [
    {
      key: "f",
      correlationSelector: "a",
      familySelector: "b",
      stepSelector: "c",
      startMarkers: [],
      completionMarkers: [],
      includeUncorrelated: false,
    },
  ],
  rollupRules: [
    {
      family: "log_observability_volume",
      metric: "log_observability_volume",
      sourceEventType: "log_observability_event",
      completenessRequired: false,
      dimensions: [{ slot: 1, dimension: "d", selector: "payload.severity" }],
    },
  ],
  dashboards: [
    {
      key: "log_observability",
      title: "Log observability",
      defaultRange: "7d",
      refreshSeconds: 60,
      requiredScopes: ["reporting:read"],
      widgets: [
        {
          key: "volume",
          title: "Log volume",
          kind: "time_series",
          template: "log_observability_overview",
          metrics: ["log_observability_volume"],
        },
      ],
    },
  ],
  exportFormats: ["manifest"],
  trust: { safeFields: ["coverage.status"], redactionGuard: ["email"] },
  redactionRules: [
    {
      sourceSystem: "s",
      sourceEventType: "e",
      selectorFields: [],
      allowedFields: [],
      reasonClasses: [],
      resultShape: "summary",
    },
  ],
  proof: {
    key: "log_observability_proof",
    templates: [],
    safeMetadataFields: [],
    forbiddenFields: [],
    outputLayout: "summary",
  },
  identity: { subject: { selector: "s", type: "subject" } },
  transitionRules: [{ key: "t", identity: "subject", stepSelector: "s", steps: [], maxDurationMs: 1, maxEvents: 1 }],
  activationRules: [{ key: "a", identity: "subject", predicate: { selector: "s" }, cohortWindowDays: 1 }],
  retentionRules: [{ key: "r", activationRule: "a", returnWindowDays: [1], returnPredicate: { selector: "s" } }],
  activityRules: [{ key: "ac", identity: "subject", bucketDays: 1 }],
  observation: { version: 1, sources: [{ key: "s", label: "S" }], assets: [{ key: "a", label: "A" }], series: [] },
  reconciliations: [{ version: 1, tenantKey: "t", seriesKey: "s", mode: "m", maxAgeSeconds: 1, sources: [] }],
  assetHierarchy: { version: 1, tenantKey: "t", nodes: [], edges: [] },
  accounting: { version: 1, usageMetric: "u", schedules: [] },
};

describe("reporting pack setup templates", () => {
  it("lists the setup templates on the admin route", async () => {
    const fetchImpl = mockFetch({
      templates: [
        {
          kind: "log_observability",
          displayName: "Log observability",
          definition,
          bindings: [
            { key: "eventType", label: "Registered event type", required: true },
            { key: "severityField", label: "Severity field", required: true },
            { key: "resourceField", label: "Resource field", required: true },
          ],
        },
      ],
    });
    const response = await client(fetchImpl).admin.reportingPacks.listSetupTemplates();

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "http://localhost:8080/api/v1/admin/reporting-packs/setup-templates",
    );
    // Every contracted field survives the decode; nothing is dropped.
    expect(response.templates[0]?.definition).toEqual(definition);
    expect(response.templates[0]?.bindings.map((binding) => binding.key)).toEqual([
      "eventType",
      "severityField",
      "resourceField",
    ]);
  });

  it("binds typed log-observability bindings on the admin route", async () => {
    const fetchImpl = mockFetch({ kind: "log_observability", definition });
    const response = await client(fetchImpl).admin.reportingPacks.bindSetupTemplate("log_observability", {
      bindings: { eventType: "log_observability_event", severityField: "severity", resourceField: "resource" },
    });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "http://localhost:8080/api/v1/admin/reporting-packs/setup-templates/log_observability/bind",
    );
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      bindings: { eventType: "log_observability_event", severityField: "severity", resourceField: "resource" },
    });
    expect(response.definition).toEqual(definition);
  });

  it("surfaces an unknown kind or invalid field as the backend problem error", async () => {
    const fetchImpl = mockFetch({ title: "unknown setup template", status: 400 }, 400);
    const error = await client(fetchImpl)
      .admin.reportingPacks.bindSetupTemplate("nope", {
        bindings: { eventType: "e", severityField: "s", resourceField: "r" },
      })
      .catch((thrown: unknown) => thrown);
    expect((error as Error).name).toBe("CustdRequestError");
    expect((error as { problem?: { title?: string } }).problem?.title).toBe("unknown setup template");
  });
});
