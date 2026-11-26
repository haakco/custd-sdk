import { readFileSync } from "node:fs";
import { dto, type RowArea } from "./surface-conformance.test-helper";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

const renderedWidget = (): Response =>
  jsonResponse(
    JSON.parse(readFileSync(new URL("../../contract-fixtures/reporting-query-rendered.json", import.meta.url), "utf8")),
  );

const completedRunExport = { formats: ["csv"] };

export const coreRows: RowArea = {
  rows: [
    {
      id: "admin-api POST /api/v1/admin/oauth-clients/{clientId}/replace-unknown-secret",
      params: { clientId: "clientId-1" },
      call: (c) => c.custd.admin.oauthClients.replaceUnknownSecret("clientId-1"),
    },
    {
      id: "admin-api PATCH /api/v1/admin/sites/{siteUuid}",
      params: { siteUuid: "siteUuid-1" },
      call: (c) => c.custd.admin.sites.update("siteUuid-1", dto()),
    },
    {
      id: "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/register",
      params: { tenantSlug: "acme", eventType: "page-view" },
      call: (c) => c.custd.admin.schemas.register("acme", "page-view", dto()),
    },
    {
      id: "admin-api GET /api/v1/admin/privacy/consent",
      query: { subjectId: "subject-1", companySlug: "acme" },
      call: (c) => c.custd.admin.privacy.listConsent("subject-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/privacy/consent",
      call: (c) => c.custd.admin.privacy.recordConsent(dto()),
    },
    {
      id: "admin-api DELETE /api/v1/admin/privacy/consent/{subjectId}",
      params: { subjectId: "subject-1" },
      query: { purpose: "analytics", source: "web", companySlug: "acme" },
      call: (c) =>
        c.custd.admin.privacy.revokeConsent("subject-1", { purpose: "analytics", source: "web", companySlug: "acme" }),
    },
    {
      id: "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}/events",
      params: { tenantSlug: "acme" },
      call: (c) => c.custd.admin.storageAlerts.listEvents("acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/reporting-packs/generation-validity",
      call: (c) => c.custd.admin.reportingPacks.listGenerationValidity(),
    },
    { id: "analytics-api GET /api/v1/reporting/dashboards", call: (c) => c.custd.reporting.dashboards() },
    {
      id: "analytics-api POST /api/v1/reporting/dashboard-data-generations",
      call: (c) => c.custd.reporting.generateDashboardData(dto()),
    },
    {
      id: "analytics-api POST /api/v1/reporting/draft-preview",
      response: renderedWidget,
      call: (c) => c.custd.reporting.previewDraft(dto()),
    },
    {
      id: "analytics-api POST /api/v1/reporting/exports/completed-run",
      call: (c) => c.custd.reporting.createCompletedRunExport(dto(completedRunExport)),
    },
    {
      id: "analytics-api GET /api/v1/analytics/active-now",
      query: { site: "site-1" },
      response: () => jsonResponse({ activeNow: 3, windowSeconds: 300 }),
      call: (c) => c.custd.analytics.activeNow("site-1"),
    },
    {
      id: "analytics-api GET /api/v1/analytics/dashboard-summary",
      response: () => jsonResponse({ loadedDays: null, dogfood: { sources: null, metrics: null } }),
      call: async (c) => {
        const summary = await c.custd.analytics.dashboardSummary();
        if (summary.loadedDays.length !== 0 || summary.dogfood.sources.length !== 0) throw new Error("null lists");
      },
    },
    {
      id: "analytics-api GET /api/v1/telemetry/event-count",
      query: { date: "2026-11-20", eventType: "page-view" },
      response: () => jsonResponse({ count: 4 }),
      call: (c) => c.custd.analytics.eventCount({ date: "2026-11-20", eventType: "page-view" }),
    },
    {
      id: "schema-registry GET /api/v1/schemas",
      response: () => jsonResponse(null),
      call: async (c) => {
        if ((await c.custd.schemas.list()).eventTypes.length !== 0) throw new Error("null list");
      },
    },
    {
      id: "schema-registry GET /api/v1/schemas/{eventType}/versions",
      params: { eventType: "page-view" },
      response: () => jsonResponse(null),
      call: async (c) => {
        if ((await c.custd.schemas.listVersions("page-view")).versions.length !== 0) throw new Error("null list");
      },
    },
    {
      id: "schema-registry GET /api/v1/schemas/{eventType}/{version}",
      params: { eventType: "page-view", version: "1.0.0" },
      response: () => jsonResponse({ type: "object" }),
      call: (c) => c.custd.schemas.get("page-view", "1.0.0"),
    },
    {
      id: "schema-registry POST /api/v1/schemas",
      call: (c) => c.custd.schemas.register(dto()),
    },
    {
      id: "schema-registry POST /api/v1/schemas/{eventType}/{version}/active",
      params: { eventType: "page-view", version: "1.0.0" },
      call: (c) => c.custd.schemas.activate("page-view", "1.0.0"),
    },
    {
      id: "schema-registry PUT /api/v1/schemas/{eventType}/{version}/enabled",
      params: { eventType: "page-view", version: "1.0.0" },
      call: (c) => c.custd.schemas.enable("page-view", "1.0.0"),
    },
    {
      id: "schema-registry DELETE /api/v1/schemas/{eventType}/{version}/enabled",
      params: { eventType: "page-view", version: "1.0.0" },
      call: (c) => c.custd.schemas.disable("page-view", "1.0.0"),
    },
    {
      id: "schema-registry DELETE /api/v1/schemas/{eventType}",
      params: { eventType: "page-view" },
      call: (c) => c.custd.schemas.disableEventType("page-view"),
    },
    {
      id: "admin-api GET /api/v1/app-hosts/{host}/discovery",
      params: { host: "app.example.com" },
      call: (c) => c.custd.publicReads.appDiscovery("app.example.com"),
    },
    {
      id: "admin-api GET /api/v1/shared-site-reports/{token}",
      params: { token: "share-token-1" },
      call: (c) => c.custd.publicReads.sharedSiteReport("share-token-1"),
    },
    {
      id: "admin-api GET /api/v1/auth-domain-monitoring/inventory",
      response: () => jsonResponse({ hosts: null, retiredHosts: null }),
      call: async (c) => {
        const inventory = await c.custd.publicReads.authDomainMonitoringInventory("monitoring-key-1");
        if (inventory.hosts.length !== 0 || inventory.retiredHosts.length !== 0) throw new Error("null lists");
      },
    },
  ],
  decoded: [
    "admin-api GET /api/v1/admin/privacy/consent",
    "admin-api GET /api/v1/admin/reporting-packs/generation-validity",
    "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}/events",
    "admin-api PATCH /api/v1/admin/sites/{siteUuid}",
    "analytics-api GET /api/v1/reporting/dashboards",
    "analytics-api POST /api/v1/reporting/dashboard-data-generations",
    "analytics-api POST /api/v1/reporting/exports/completed-run",
  ],
};
