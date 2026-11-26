// Route conformance: every Custd operation the TypeScript SDK implements, called through its public
// method with a fake fetch, asserting the HTTP method and path the SDK sends. The table is the only
// source of contract-fixtures/api/coverage/js.json, so the file cannot claim an unproven route.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  AppItemsClient,
  type BrowserTracker,
  type BrowserTrackerConfig,
  CurrentAppProfileClient,
  createBrowserTracker,
  ErrorCaptureClient,
  fetchBrowserSiteConfig,
} from "./browser";
import { installBrowserGlobals } from "./browser-globals.test-helper";
import { CustdClient, type SubjectInsightRequest } from "./index";
import { auditFilter, type Clients, dto, type Row, type RowArea, usageWindow } from "./surface-conformance.test-helper";
import { coreRows } from "./surface-rows-core.test-helper";
import { ingestRows } from "./surface-rows-ingest.test-helper";
import { measurementRows } from "./surface-rows-measurement.test-helper";
import { notifyRows } from "./surface-rows-notify.test-helper";
import { operatorRows } from "./surface-rows-operator.test-helper";
import { publicRows } from "./surface-rows-public.test-helper";

type Operation = {
  id: string;
  method: string;
  path: string;
  sdk: "required" | "excluded";
  example?: string;
  query?: { name: string; required: boolean }[];
};

type Example = { minimal: unknown; maximal: unknown };

type RecordedRequest = { method: string; url: string };

const apiRoot = new URL("../../contract-fixtures/api/", import.meta.url);
const readJson = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, apiRoot), "utf8")) as T;
const operations = new Map(readJson<{ operations: Operation[] }>("operations.json").operations.map((o) => [o.id, o]));
const coverage = readJson<{ operations: string[] }>("coverage/js.json").operations;

function example(operation: Operation): Example | undefined {
  return operation.example ? readJson<Example>(operation.example) : undefined;
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body ?? {}), { status: 200, headers: { "content-type": "application/json" } });
}

function newClients(respond: () => Response, requests: RecordedRequest[], actingCompanySlug?: string): Clients {
  const fetchImpl = (async (url: unknown, init?: RequestInit) => {
    requests.push({ method: init?.method ?? "GET", url: String(url) });
    return respond();
  }) as typeof fetch;
  return {
    custd: new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "admin-token",
      fetch: fetchImpl,
      actingCompanySlug,
    }),
    items: new AppItemsClient({
      apiBaseUrl: "http://localhost:8080",
      siteKey: "site_pk_conformance",
      fetch: fetchImpl,
      userToken: () => "user-token",
    }),
    profile: new CurrentAppProfileClient({
      apiBaseUrl: "https://localhost:8080",
      accessToken: () => "user-token",
      fetch: fetchImpl,
    }),
    errors: new ErrorCaptureClient({
      baseUrl: "http://localhost:8080",
      writeKey: `site_pk_${"a".repeat(32)}`,
      environment: "test",
      fetch: fetchImpl,
    }),
    fetch: fetchImpl,
  };
}

function expectedPath(operation: Operation, params: Record<string, string> = {}): string {
  return operation.path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`${operation.id}: no sample value for {${name}}`);
    return value;
  });
}

const environmentParams = { projectId: "project-1", environmentId: "environment-1" };
const uuid = "123e4567-e89b-42d3-a456-426614174000";
const idempotent = { idempotencyKey: "idempotency-key-1" };
const principal = {
  projectId: "project-1",
  environmentId: "environment-1",
  directoryId: "directory-1",
  providerSubject: "subject-1",
};
const grant = {
  principal: { kind: "machine" as const, clientId: "custd-producer" },
  target: { kind: "sub_client" as const, scopeUuid: uuid },
  action: "read" as const,
};
const timePlan = {
  horizonMs: 60_000,
  blocks: [{ uuid: "block-1", semanticKey: "focus", title: "Focus", basis: "absolute" as const }],
};
const event = {
  eventUuid: "event-1",
  eventTypeSlug: "page-view",
  schemaVersion: "1.0.0",
  timestamp: "2026-11-20T06:00:00.000Z",
  companySlug: "acme",
  context: { device: { type: "desktop" } },
  payload: {},
};
const subjectInsight = JSON.parse(
  readFileSync(new URL("../reporting-subject-insight-request.json", apiRoot), "utf8"),
) as SubjectInsightRequest;

function batchClient(c: Clients): CustdClient {
  const client = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "token",
    fetch: c.fetch,
    batch: { maxBatchSize: 10 },
  });
  client.enqueue(event);
  return client;
}

function pngPhoto(): Blob {
  return new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
}

function photo(): Response {
  return new Response(pngPhoto(), { status: 200, headers: { "content-type": "image/png" } });
}

function auditExport(): Response {
  return new Response("id\n", { status: 200, headers: { "content-type": "text/csv" } });
}

function download(): Response {
  const bytes = new Uint8Array([1, 2, 3]);
  return new Response(bytes, {
    status: 200,
    headers: { "content-length": "3", "x-checksum-sha256": createHash("sha256").update(bytes).digest("hex") },
  });
}

/** Runs the browser tracker against stubbed browser globals, sending through the recording fetch. */
async function withBrowserTracker(
  c: Clients,
  config: Partial<BrowserTrackerConfig>,
  use: (tracker: BrowserTracker) => Promise<void>,
): Promise<void> {
  installBrowserGlobals();
  vi.stubGlobal("fetch", c.fetch);
  try {
    const tracker = createBrowserTracker({
      baseUrl: "http://localhost:8087",
      siteUuid: "site-1",
      writeKey: "site_pk_conformance",
      allowedOrigins: ["https://example.com"],
      trackInitialPageView: false,
      ...config,
    });
    await use(tracker);
  } finally {
    vi.unstubAllGlobals();
  }
}

const baselineRows: Row[] = [
  {
    id: "admin-api DELETE /api/v1/admin/apps/{slug}/deploy-credentials/{clientId}",
    params: { slug: "slug-1", clientId: "clientId-1" },
    call: (c) => c.custd.admin.authProjects.deleteAppDeployCredential("slug-1", "clientId-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/data-label-assignments/schema-fields/{assignmentUuid}",
    params: { assignmentUuid: "assignmentUuid-1" },
    call: (c) => c.custd.admin.dataLabels.removeSchemaFieldAssignment("assignmentUuid-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}",
    params: { slug: "slug-1", definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.dataLabels.removeEventTypeDefault("slug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/oauth-clients/{clientId}",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.admin.oauthClients.delete("clientId-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/retention/policies/{tenantSlug}",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.retention.delete("tenantSlug-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/sites/{siteUuid}",
    params: { siteUuid: "siteUuid-1" },
    call: (c) => c.custd.admin.sites.delete("siteUuid-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/storage/alerts/{tenantSlug}/{ruleId}",
    params: { tenantSlug: "tenantSlug-1", ruleId: "ruleId-1" },
    call: (c) => c.custd.admin.storageAlerts.deleteRule("tenantSlug-1", "ruleId-1"),
  },
  {
    id: "admin-api DELETE /api/v1/admin/tenants/{slug}",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.delete("slug-1"),
  },
  {
    id: "admin-api DELETE /api/v1/app/item/alerts/rules/{ruleUuid}",
    params: { ruleUuid: "ruleUuid-1" },
    call: (c) => c.items.removeAlertRule({ item: "item-1" }, "ruleUuid-1"),
  },
  {
    id: "admin-api DELETE /api/v1/app/item/alerts/subscription",
    call: (c) => c.items.unsubscribeAlertEmail({ item: "item-1" }),
  },
  {
    id: "admin-api DELETE /api/v1/app/item/alerts/webhooks/{webhookUuid}",
    params: { webhookUuid: "webhookUuid-1" },
    call: (c) => c.items.removeAlertWebhook({ item: "item-1" }, "webhookUuid-1"),
  },
  {
    id: "admin-api DELETE /api/v1/app/item/entries/{entryUuid}",
    params: { entryUuid: "entryUuid-1" },
    call: (c) => c.items.removeEntry({ item: "item-1" }, "entryUuid-1"),
  },
  {
    id: "admin-api DELETE /api/v1/app/item/links/{linkUuid}",
    params: { linkUuid: "linkUuid-1" },
    call: (c) => c.items.revokeLink({ item: "item-1" }, "linkUuid-1"),
  },
  { id: "admin-api DELETE /api/v1/app/profile/photo", call: (c) => c.profile.removePhoto() },
  {
    id: "admin-api DELETE /api/v1/data-spaces/{slug}",
    params: { slug: "slug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.dataSpaces.revoke("slug-1", "acme"),
  },
  {
    id: "admin-api POST /api/v1/data-spaces/{slug}/erasure",
    params: { slug: "slug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.dataSpaces.erase("slug-1", "acme"),
  },
  {
    id: "admin-api GET /api/v1/data-spaces/{slug}/erasure",
    params: { slug: "slug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.dataSpaces.getErasure("slug-1", "acme"),
  },
  {
    id: "admin-api PUT /api/v1/producer-provisioning/{clientId}/signing-keys",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.provisioning.producers.setSigningKeys("clientId-1", { publicKeys: ["AAAA"] }),
  },
  {
    id: "admin-api DELETE /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}",
    params: { slug: "dataSpaceSlug-1", producerSlug: "producerSlug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.reservations.release("dataSpaceSlug-1", "producerSlug-1", "acme"),
  },
  {
    id: "admin-api DELETE /api/v1/producer-provisioning/{clientId}",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.provisioning.producers.revoke("clientId-1"),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/keyword-lists",
    call: (c) => c.custd.admin.siteDomains.deleteKeywordList("name-1", "siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.delete("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/analytics/ga4",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.disconnectAnalytics("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/attestation",
    params: { domainUuid: "domainUuid-1" },
    query: { companySlug: "acme" },
    call: (c) => c.custd.admin.siteDomains.unattest("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/indexnow",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.disableIndexNow("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}",
    params: { domainUuid: "domainUuid-1", keywordUuid: "keywordUuid-1" },
    call: (c) => c.custd.admin.siteDomains.untrackKeyword("domainUuid-1", "keywordUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/report-shares/{shareUuid}",
    params: { domainUuid: "domainUuid-1", shareUuid: "shareUuid-1" },
    call: (c) => c.custd.admin.siteDomains.revokeReportShare("domainUuid-1", "shareUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}",
    params: { domainUuid: "domainUuid-1", reportUuid: "reportUuid-1" },
    call: (c) => c.custd.admin.siteDomains.deleteSavedReport("domainUuid-1", "reportUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/search/{provider}",
    params: { domainUuid: "domainUuid-1", provider: "google" },
    call: (c) => c.custd.admin.siteDomains.disconnectSearch("domainUuid-1", "google", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/status-page",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.unpublishStatusPage("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/tenant-storage-locations/{id}",
    params: { id: "1" },
    call: (c) => c.custd.admin.tenantStorage.revoke(1),
  },
  { id: "admin-api GET /api/v1/admin/apps", call: (c) => c.custd.admin.authProjects.listApps("after-1") },
  {
    id: "admin-api GET /api/v1/admin/apps/{slug}",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.authProjects.getApp("slug-1"),
  },
  { id: "admin-api GET /api/v1/admin/audit/events", call: (c) => c.custd.admin.audit.listEvents(auditFilter) },
  {
    id: "admin-api GET /api/v1/admin/audit/events/{eventId}",
    params: { eventId: "eventId-1" },
    call: (c) => c.custd.admin.audit.getEvent("eventId-1", { scope: "tenant", companySlug: "acme" }),
  },
  { id: "admin-api GET /api/v1/admin/auth-projects", call: (c) => c.custd.admin.authProjects.listProjects("after-1") },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/capability",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.getEnvironmentCapability("projectId-1", "environmentId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.listDirectories("projectId-1", "environmentId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/export",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.exportPrincipal(principal),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/memberships",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.listPrincipalMemberships(principal),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/profile",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.getPrincipalProfile(principal),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions",
    params: {
      projectId: "projectId-1",
      environmentId: "environmentId-1",
      directoryId: "directoryId-1",
      providerSubject: "providerSubject-1",
    },
    call: (c) =>
      c.custd.admin.authProjects.listPrincipalSessions(
        "projectId-1",
        "environmentId-1",
        "directoryId-1",
        "providerSubject-1",
      ),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.listInvitations("projectId-1", "environmentId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/organisations",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.listEnvironmentOrganisations("projectId-1", "environmentId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) =>
      c.custd.admin.authProjects.listPrincipals("projectId-1", "environmentId-1", { limit: 10, cursor: "cursor-1" }),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences",
    params: { projectId: "project-1", environmentId: "environment-1", providerSubject: "subject-1" },
    call: (c) => c.custd.admin.authProjects.listPrincipalAudiences(principal),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.listAppReleases("projectId-1", "environmentId-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/status",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.getEnvironmentStatus("projectId-1", "environmentId-1"),
  },
  { id: "admin-api GET /api/v1/admin/data-label-assignments", call: (c) => c.custd.admin.dataLabels.listAssignments() },
  { id: "admin-api GET /api/v1/admin/data-labels", call: (c) => c.custd.admin.dataLabels.list(true) },
  { id: "admin-api GET /api/v1/admin/data-labels/catalogue", call: (c) => c.custd.admin.dataLabels.catalogue(true) },
  { id: "admin-api GET /api/v1/admin/data-labels/usage", call: (c) => c.custd.admin.dataLabels.listUsage() },
  {
    id: "admin-api GET /api/v1/admin/data-labels/{definitionUuid}",
    params: { definitionUuid: "uuid-1" },
    call: (c) => c.custd.admin.dataLabels.get("uuid-1", true),
  },
  { id: "admin-api GET /api/v1/admin/data-scopes", call: (c) => c.custd.admin.dataScopes.listScopes(true) },
  {
    id: "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}",
    params: { scopeUuid: "scopeUuid-1" },
    call: (c) => c.custd.admin.dataScopes.getScope("scopeUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources",
    params: { scopeUuid: "scopeUuid-1" },
    call: (c) => c.custd.admin.dataScopes.listResources("scopeUuid-1", true),
  },
  {
    id: "admin-api GET /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}",
    params: { scopeUuid: "scopeUuid-1", resourceUuid: "resourceUuid-1" },
    call: (c) => c.custd.admin.dataScopes.getResource("scopeUuid-1", "resourceUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions",
    call: (c) => c.custd.admin.predictions.listDefinitions("companySlug-1", 10, "token-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.getDefinition("companySlug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/evaluations",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.getEvaluation("companySlug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/outcomes",
    params: { definitionUuid: "definitionUuid-1" },
    query: { pageSize: "10" },
    call: (c) => c.custd.admin.predictions.listOutcomes("companySlug-1", "definitionUuid-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs",
    params: { definitionUuid: "definitionUuid-1" },
    query: { pageSize: "10" },
    call: (c) => c.custd.admin.predictions.listRuns("companySlug-1", "definitionUuid-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/threshold-events",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.listThresholdEvents("companySlug-1", "definitionUuid-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/versions/{versionUuid}",
    params: { definitionUuid: "definitionUuid-1", versionUuid: "versionUuid-1" },
    call: (c) => c.custd.admin.predictions.getVersion("companySlug-1", "definitionUuid-1", "versionUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/sources",
    call: (c) => c.custd.admin.predictions.listSignalSources("companySlug-1", 10, "token-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/measurement/predictions/sources/{sourceUuid}",
    params: { sourceUuid: "sourceUuid-1" },
    call: (c) => c.custd.admin.predictions.getSignalSource("companySlug-1", "sourceUuid-1"),
  },
  { id: "admin-api GET /api/v1/admin/measurement/projects", call: (c) => c.custd.admin.measurement.projects.list() },
  {
    id: "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}",
    params: { projectUuid: "projectUuid-1" },
    call: (c) => c.custd.admin.measurement.projects.get("projectUuid-1"),
  },
  { id: "admin-api GET /api/v1/admin/oauth-clients", call: (c) => c.custd.admin.oauthClients.list() },
  {
    id: "admin-api GET /api/v1/admin/oauth-clients/{clientId}",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.admin.oauthClients.get("clientId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/download",
    params: { requestUuid: "requestUuid-1" },
    response: download,
    call: (c) => c.custd.admin.offboarding.download("requestUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/receipt",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.receipt("requestUuid-1"),
  },
  { id: "admin-api GET /api/v1/admin/offboarding/schedules", call: (c) => c.custd.admin.offboarding.listSchedules() },
  {
    id: "admin-api GET /api/v1/admin/offboarding/schedules/{tenantSlug}",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.offboarding.getSchedule("tenantSlug-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/offboarding/{requestUuid}",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.getRequest("requestUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/privacy/erasures",
    query: { companySlug: "companySlug-1" },
    call: (c) => c.custd.admin.privacyErasures.list("companySlug-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/privacy/erasures/{requestUuid}",
    params: { requestUuid: "requestUuid-1" },
    query: { companySlug: "companySlug-1" },
    call: (c) => c.custd.admin.privacyErasures.get("companySlug-1", "requestUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/privacy/identifiers/{companySlug}",
    params: { companySlug: "companySlug-1" },
    call: (c) => c.custd.admin.privacy.listIdentifierMappings("companySlug-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/privacy/rules",
    query: { companySlug: "acme" },
    call: (c) => c.custd.admin.privacy.getRules("acme"),
  },
  {
    id: "admin-api GET /api/v1/admin/reporting-packs/audit-events",
    call: (c) => c.custd.admin.audit.listReportingPackEvents("packKey-1"),
  },
  { id: "admin-api GET /api/v1/admin/reporting-packs/drafts", call: (c) => c.custd.admin.reportingPacks.listDrafts() },
  {
    id: "admin-api GET /api/v1/admin/reporting-packs/drafts/{draftId}",
    params: { draftId: "draftId-1" },
    call: (c) => c.custd.admin.reportingPacks.getDraft("draftId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}",
    params: { generationId: "generationId-1" },
    call: (c) => c.custd.admin.reportingPacks.getGeneration("generationId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/rollup-provenance",
    params: { generationId: "generationId-1" },
    call: (c) => c.custd.admin.reportingPacks.getRollupProvenance("generationId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/reporting-packs/generations/{generationId}/status",
    params: { generationId: "generationId-1" },
    call: (c) => c.custd.admin.reportingPacks.getGenerationStatus("generationId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/reporting-packs/setup-templates",
    call: (c) => c.custd.admin.reportingPacks.listSetupTemplates(),
  },
  { id: "admin-api GET /api/v1/admin/retention/policies", call: (c) => c.custd.admin.retention.list() },
  {
    id: "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.retention.get("tenantSlug-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}/runs",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.retention.listRuns("tenantSlug-1", { limit: 10, offset: 5 }),
  },
  {
    id: "admin-api GET /api/v1/admin/schema/audit",
    query: { tenantSlug: "acme" },
    call: (c) => c.custd.admin.schemas.audit("acme"),
  },
  {
    id: "admin-api GET /api/v1/admin/site-insights/ai-usage",
    call: (c) => c.custd.admin.siteInsights.getAIUsage("previous-month"),
  },
  { id: "admin-api GET /api/v1/admin/site-insights/tasks", call: (c) => c.custd.admin.siteInsights.listTasks() },
  { id: "admin-api GET /api/v1/admin/sites", call: (c) => c.custd.admin.sites.list() },
  {
    id: "admin-api GET /api/v1/admin/sites/{siteUuid}",
    params: { siteUuid: "siteUuid-1" },
    call: (c) => c.custd.admin.sites.get("siteUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/storage/alerts/{tenantSlug}",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.storageAlerts.listRules("tenantSlug-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/subject-exports",
    query: { limit: "25" },
    call: (c) => c.custd.admin.subjectExports.list(25),
  },
  {
    id: "admin-api GET /api/v1/admin/subject-exports/{requestId}",
    params: { requestId: "requestId-1" },
    call: (c) => c.custd.admin.subjectExports.get("requestId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/subject-exports/{requestId}/download",
    params: { requestId: "requestId-1" },
    query: { scope: "access" },
    call: (c) => c.custd.admin.subjectExports.download("requestId-1", "access"),
  },
  {
    id: "admin-api GET /api/v1/admin/tenant-manifest/{tenantSlug}/readiness",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.clientSetup.readiness("tenantSlug-1"),
  },
  { id: "admin-api GET /api/v1/admin/tenants", call: (c) => c.custd.admin.tenants.list() },
  {
    id: "admin-api GET /api/v1/admin/tenants/{slug}",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.get("slug-1"),
  },
  { id: "admin-api GET /api/v1/admin/time-plans", call: (c) => c.custd.admin.timePlans.list("companySlug-1", 10) },
  {
    id: "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.timePlans.getRun("companySlug-1", "runUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/annotations",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.timePlans.listAnnotations("companySlug-1", "runUuid-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/history",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.timePlans.history("companySlug-1", "runUuid-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/time-plans/{planUuid}",
    params: { planUuid: "planUuid-1" },
    call: (c) => c.custd.admin.timePlans.get("companySlug-1", "planUuid-1"),
  },
  { id: "admin-api GET /api/v1/admin/usage/me", call: (c) => c.custd.admin.usage.get(usageWindow) },
  { id: "admin-api GET /api/v1/app/item", call: (c) => c.items.readItem({ item: "item-1" }) },
  { id: "admin-api GET /api/v1/app/item/alerts", call: (c) => c.items.alertSettings({ item: "item-1" }) },
  { id: "admin-api GET /api/v1/app/item/alerts/deliveries", call: (c) => c.items.alertDeliveries({ item: "item-1" }) },
  { id: "admin-api GET /api/v1/app/item/plan/forecast", call: (c) => c.items.planForecast({ item: "item-1" }) },
  { id: "admin-api GET /api/v1/app/items", call: (c) => c.items.listMyItems() },
  { id: "admin-api GET /api/v1/app/profile", call: (c) => c.profile.read() },
  { id: "admin-api GET /api/v1/app/profile/photo", response: photo, call: (c) => c.profile.readPhoto() },
  {
    id: "admin-api GET /api/v1/data-spaces",
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.dataSpaces.list("acme"),
  },
  {
    id: "admin-api GET /api/v1/data-spaces/{slug}/producer-reservations",
    params: { slug: "dataSpaceSlug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.reservations.list("dataSpaceSlug-1", "acme"),
  },
  { id: "admin-api GET /api/v1/producer-provisioning", call: (c) => c.custd.provisioning.producers.list("acme") },
  {
    id: "admin-api GET /api/v1/site-domains",
    call: (c) => c.custd.admin.siteDomains.list("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/ai-settings",
    call: (c) => c.custd.admin.siteDomains.getAISettings({ companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/ai-usage",
    call: (c) => c.custd.admin.siteDomains.getAIUsage({ companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/alert-destination",
    call: (c) => c.custd.admin.siteDomains.getAlertDestination("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/content-gap",
    call: (c) => c.custd.admin.siteDomains.getContentGap("siteUuid-1", "seed-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/keyword-clusters",
    call: (c) => c.custd.admin.siteDomains.getKeywordClusters("name-1", "siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/keyword-lists",
    call: (c) => c.custd.admin.siteDomains.listKeywordLists("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/portfolio-summary",
    call: (c) => c.custd.admin.siteDomains.getPortfolioSummary({ companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/project-context",
    call: (c) => c.custd.admin.siteDomains.getProjectContext("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/referring-domains",
    call: (c) => c.custd.admin.siteDomains.getReferringDomains("domain-1", "siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/regional-trends",
    call: (c) => c.custd.admin.siteDomains.getRegionalTrends("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/search-account",
    call: (c) => c.custd.admin.siteDomains.getSearchAccount({ companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/search-pool",
    call: (c) => c.custd.admin.siteDomains.getSearchPool({ companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/search-pool/queries",
    call: (c) => c.custd.admin.siteDomains.listSearchPoolQueries("shoes", 10, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/topic-trends",
    call: (c) => c.custd.admin.siteDomains.getTopicTrends("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/web-domains",
    call: (c) => c.custd.admin.siteDomains.getWebDomains("siteUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/web-pages",
    call: (c) =>
      c.custd.admin.siteDomains.listWebPages(
        "domain-1",
        { siteUuid: "siteUuid-1", after: "after-1", limit: 10 },
        { companySlug: "acme" },
      ),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.get("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/ai-visibility",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.getAIVisibility("domainUuid-1", "2026-11-01", "2026-11-20", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/analytics",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getAnalytics("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/audit-delta",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getAuditDelta("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/audit-pages",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listAuditPages("domainUuid-1", 5, 10, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/campaign-links",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listCampaignLinks("domainUuid-1", true, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/export",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getExport("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/export/search-metrics",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.listExportSearchMetrics(
        "domainUuid-1",
        { offset: 5, limit: 10 },
        { companySlug: "acme" },
      ),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/findings",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listFindings("domainUuid-1", "open", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/findings/{findingUuid}/search-impact",
    params: { domainUuid: "domainUuid-1", findingUuid: "findingUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.getFindingSearchImpact("domainUuid-1", "findingUuid-1", 7, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/incidents",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listIncidents("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/indexnow",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getIndexNow("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.getLighthouseHistory("domainUuid-1", 7, {
        companySlug: "acme",
        url: "https://example.com/",
      }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/lighthouse/pages",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getLighthousePages("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/next-actions",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getNextActions("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/page-facts",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getPageFacts("domainUuid-1", "url-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks/{recheckUuid}",
    params: { domainUuid: "domainUuid-1", recheckUuid: "recheckUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getPageRecheck("domainUuid-1", "recheckUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/page-search-queries",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getPageSearchQueries("domainUuid-1", "url-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/page-wording",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.comparePageWording(
        "domainUuid-1",
        { firstUrl: "https://example.com/a", secondUrl: "https://example.com/b" },
        { companySlug: "acme" },
      ),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/probes",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listProbes("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/rankings",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getRankings("domainUuid-1", 7, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/report",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.getReport("domainUuid-1", { companySlug: "acme", template: "executive", days: 7 }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/report-shares",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listReportShares("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listSavedReports("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}",
    params: { domainUuid: "domainUuid-1", reportUuid: "reportUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getSavedReport("domainUuid-1", "reportUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/search",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getSearchPerformance("domainUuid-1", 7, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/search-value",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getSearchValue("domainUuid-1", ["goal-1"], 7, { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/search/inspections",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listSearchInspections("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/search/rows",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.listSearchRows(
        "domainUuid-1",
        { dimension: "page", provider: "google", days: 7, offset: 5, limit: 10 },
        { companySlug: "acme" },
      ),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/status-page",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getStatusPageSettings("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/traffic",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.getTraffic("domainUuid-1", "2026-11-01", "2026-11-20", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/uptime-history",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getUptimeHistory("domainUuid-1", 7, { companySlug: "acme" }),
  },
  { id: "admin-api GET /api/v1/tenant-storage-locations", call: (c) => c.custd.admin.tenantStorage.list() },
  {
    id: "admin-api GET /api/v1/tenant-storage-locations/{id}",
    params: { id: "1" },
    call: (c) => c.custd.admin.tenantStorage.get(1),
  },
  {
    id: "admin-api PATCH /api/v1/admin/data-label-values/{valueUuid}",
    params: { valueUuid: "uuid-1" },
    call: (c) => c.custd.admin.dataLabels.updateValue("uuid-1", dto()),
  },
  {
    id: "admin-api PATCH /api/v1/admin/data-labels/{definitionUuid}",
    params: { definitionUuid: "uuid-1" },
    call: (c) => c.custd.admin.dataLabels.update("uuid-1", dto()),
  },
  {
    id: "admin-api PATCH /api/v1/admin/measurement/predictions/definitions/{definitionUuid}",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.updateDefinition("companySlug-1", "definitionUuid-1", dto()),
  },
  {
    id: "admin-api PATCH /api/v1/admin/oauth-clients/{clientId}/scopes",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.admin.oauthClients.updateScopes("clientId-1", dto()),
  },
  { id: "admin-api PATCH /api/v1/app/item", call: (c) => c.items.updateSettings({ item: "item-1" }, dto()) },
  {
    id: "admin-api PATCH /api/v1/app/item/meeting/minutes",
    call: (c) => c.items.updateMeetingMinutes({ item: "item-1" }, dto()),
  },
  { id: "admin-api PATCH /api/v1/app/item/plan", call: (c) => c.items.updatePlan({ item: "item-1" }, dto()) },
  { id: "admin-api PATCH /api/v1/app/profile", call: (c) => c.profile.update(dto()) },
  {
    id: "admin-api PATCH /api/v1/producer-provisioning/{clientId}/environment",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.provisioning.producers.updateEnvironment("clientId-1", "environment-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/access-log-hours/replay",
    call: (c) => c.custd.admin.siteDomains.replayAccessLogHour("2026-11-20T06:00:00Z"),
  },
  {
    id: "admin-api POST /api/v1/admin/apps/{slug}/deploy-credentials",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.authProjects.createAppDeployCredential("slug-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/company-binding",
    params: { projectId: "projectId-1" },
    call: (c) => c.custd.admin.authProjects.bindProjectCompany("projectId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/delete",
    params: { projectId: "projectId-1" },
    call: (c) => c.custd.admin.authProjects.deleteProject("projectId-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments",
    params: { projectId: "projectId-1" },
    call: (c) => c.custd.admin.authProjects.createEnvironment("projectId-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/delete",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.deleteEnvironment("projectId-1", "environmentId-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/memberships/revoke",
    params: {
      projectId: "projectId-1",
      environmentId: "environmentId-1",
      directoryId: "directoryId-1",
      providerSubject: "providerSubject-1",
    },
    call: (c) =>
      c.custd.admin.authProjects.revokePrincipalMembership(
        "projectId-1",
        "environmentId-1",
        "directoryId-1",
        "providerSubject-1",
        dto(),
      ),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/offboard",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.offboardEnvironment("projectId-1", "environmentId-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/preview",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.previewEnvironmentDesiredState("projectId-1", "environmentId-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases",
    params: { projectId: "projectId-1", environmentId: "environmentId-1" },
    call: (c) => c.custd.admin.authProjects.createAppRelease("projectId-1", "environmentId-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/files",
    params: { projectId: "projectId-1", environmentId: "environmentId-1", releaseId: "releaseId-1" },
    call: (c) =>
      c.custd.admin.authProjects.uploadAppReleaseFile(
        "projectId-1",
        "environmentId-1",
        "releaseId-1",
        "filePath-1",
        dto(),
      ),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/promote",
    params: { projectId: "projectId-1", environmentId: "environmentId-1", releaseId: "releaseId-1" },
    call: (c) => c.custd.admin.authProjects.promoteAppRelease("projectId-1", "environmentId-1", "releaseId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/releases/{releaseId}/verify",
    params: { projectId: "projectId-1", environmentId: "environmentId-1", releaseId: "releaseId-1" },
    call: (c) => c.custd.admin.authProjects.verifyAppRelease("projectId-1", "environmentId-1", "releaseId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/data-label-values/{valueUuid}/disable",
    params: { valueUuid: "uuid-1" },
    call: (c) => c.custd.admin.dataLabels.disableValue("uuid-1"),
  },
  { id: "admin-api POST /api/v1/admin/data-labels", call: (c) => c.custd.admin.dataLabels.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/data-labels/{definitionUuid}/disable",
    params: { definitionUuid: "uuid-1" },
    call: (c) => c.custd.admin.dataLabels.disable("uuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/data-labels/{definitionUuid}/values",
    params: { definitionUuid: "uuid-1" },
    call: (c) => c.custd.admin.dataLabels.createValue("uuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/disable",
    params: { scopeUuid: "scopeUuid-1" },
    call: (c) => c.custd.admin.dataScopes.disableScope("scopeUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}/disable",
    params: { scopeUuid: "scopeUuid-1", resourceUuid: "resourceUuid-1" },
    call: (c) => c.custd.admin.dataScopes.disableResource("scopeUuid-1", "resourceUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions",
    call: (c) => c.custd.admin.predictions.createDefinition("companySlug-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/activate",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.activateVersion("companySlug-1", "definitionUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/archive",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.archiveDefinition("companySlug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/pause",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.pauseDefinition("companySlug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/publish",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.publishVersion("companySlug-1", "definitionUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/resume",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.resumeDefinition("companySlug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/run-now",
    params: { definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.predictions.runNow("companySlug-1", "definitionUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/sources",
    call: (c) => c.custd.admin.predictions.createSignalSource("companySlug-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/activate",
    params: { sourceUuid: "sourceUuid-1" },
    call: (c) => c.custd.admin.predictions.activateSignalSource("companySlug-1", "sourceUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/predictions/sources/{sourceUuid}/archive",
    params: { sourceUuid: "sourceUuid-1" },
    call: (c) => c.custd.admin.predictions.archiveSignalSource("companySlug-1", "sourceUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/projects",
    call: (c) => c.custd.admin.measurement.projects.create(dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk",
    params: { projectUuid: "projectUuid-1" },
    call: (c) => c.custd.admin.measurement.projects.submitObservation("projectUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv",
    params: { projectUuid: "projectUuid-1" },
    call: (c) => c.custd.admin.measurement.projects.importCSVString("projectUuid-1", "csv-1", 1),
  },
  { id: "admin-api POST /api/v1/admin/oauth-clients", call: (c) => c.custd.admin.oauthClients.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/oauth-clients/{clientId}/rotate-secret",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.admin.oauthClients.rotateSecret("clientId-1"),
  },
  { id: "admin-api POST /api/v1/admin/offboarding", call: (c) => c.custd.admin.offboarding.requestOffboarding(dto()) },
  {
    id: "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/acknowledge",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.acknowledge("requestUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/execute",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.execute("requestUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/export",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.export("requestUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/preview",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.preview("requestUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/retry",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.retry("requestUuid-1"),
  },
  { id: "admin-api POST /api/v1/admin/offboarding/schedules", call: (c) => c.custd.admin.offboarding.schedule(dto()) },
  {
    id: "admin-api POST /api/v1/admin/offboarding/schedules/{tenantSlug}/cancel",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.offboarding.cancelSchedule("tenantSlug-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/offboarding/{requestUuid}/cancel",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.cancelRequest("requestUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/offboarding/{requestUuid}/confirm",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.offboarding.confirmRequest("requestUuid-1"),
  },
  { id: "admin-api POST /api/v1/admin/privacy/erasures", call: (c) => c.custd.admin.privacyErasures.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/privacy/erasures/{requestUuid}/force",
    params: { requestUuid: "requestUuid-1" },
    call: (c) => c.custd.admin.privacyErasures.force("companySlug-1", "requestUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/privacy/identifiers/{companySlug}/map",
    params: { companySlug: "companySlug-1" },
    call: (c) => c.custd.admin.privacy.mapIdentifier("companySlug-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/drafts",
    call: (c) => c.custd.admin.reportingPacks.createDraft(dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/publish",
    params: { draftId: "draftId-1" },
    call: (c) => c.custd.admin.reportingPacks.publish("draftId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/drafts/{draftId}/restart",
    params: { draftId: "draftId-1" },
    call: (c) => c.custd.admin.reportingPacks.restart("draftId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/generations/{generationId}/rollback",
    params: { generationId: "generationId-1" },
    call: (c) => c.custd.admin.reportingPacks.rollbackGeneration("generationId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/preview",
    call: (c) => c.custd.admin.reportingPacks.preview(dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/setup-templates/{kind}/bind",
    params: { kind: "kind-1" },
    call: (c) => c.custd.admin.reportingPacks.bindSetupTemplate("kind-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/reporting-packs/validate",
    call: (c) => c.custd.admin.reportingPacks.validate(dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/apply",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.retention.apply("tenantSlug-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/retention/policies/{tenantSlug}/preview",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.retention.preview("tenantSlug-1"),
  },
  { id: "admin-api POST /api/v1/admin/schema/validate", call: (c) => c.custd.admin.schemas.validate(dto()) },
  {
    id: "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/dry-run",
    params: { tenantSlug: "tenantSlug-1", eventType: "eventTypeSlug-1" },
    call: (c) => c.custd.admin.schemas.dryRun("tenantSlug-1", "eventTypeSlug-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/schema/{tenantSlug}/{eventType}/enable",
    params: { tenantSlug: "tenantSlug-1", eventType: "eventTypeSlug-1" },
    call: (c) => c.custd.admin.schemas.enableVersion("tenantSlug-1", "eventTypeSlug-1", dto()),
  },
  { id: "admin-api POST /api/v1/admin/sites", call: (c) => c.custd.admin.sites.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/sites/{siteUuid}/rotate-write-key",
    params: { siteUuid: "siteUuid-1" },
    call: (c) => c.custd.admin.sites.rotateWriteKey("siteUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/storage/alerts/{tenantSlug}",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.storageAlerts.createRule("tenantSlug-1", dto()),
  },
  { id: "admin-api POST /api/v1/admin/subject-exports", call: (c) => c.custd.admin.subjectExports.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/subject-exports/{requestId}/cancel",
    params: { requestId: "requestId-1" },
    call: (c) => c.custd.admin.subjectExports.cancel("requestId-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/subject-exports/{requestId}/force",
    params: { requestId: "requestId-1" },
    call: (c) => c.custd.admin.subjectExports.force("requestId-1", { companySlug: "acme" }),
  },
  { id: "admin-api POST /api/v1/admin/tenants", call: (c) => c.custd.admin.tenants.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/time-plans/runs",
    call: (c) => c.custd.admin.timePlans.createRun("companySlug-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.timePlans.createAnnotation("companySlug-1", "runUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/corrections",
    params: { runUuid: "runUuid-1", annotationUuid: "annotationUuid-1" },
    call: (c) => c.custd.admin.timePlans.correctAnnotation("companySlug-1", "runUuid-1", "annotationUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/annotations/{annotationUuid}/redact",
    params: { runUuid: "runUuid-1", annotationUuid: "annotationUuid-1" },
    call: (c) => c.custd.admin.timePlans.redactAnnotation("companySlug-1", "runUuid-1", "annotationUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/commands",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.timePlans.execute("companySlug-1", "runUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/{planUuid}/publish",
    params: { planUuid: "planUuid-1" },
    call: (c) => c.custd.admin.timePlans.publish("companySlug-1", "planUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/{planUuid}/retire",
    params: { planUuid: "planUuid-1" },
    call: (c) => c.custd.admin.timePlans.retire("companySlug-1", "planUuid-1"),
  },
  { id: "admin-api POST /api/v1/app/item/alerts/rules", call: (c) => c.items.addAlertRule({ item: "item-1" }, dto()) },
  { id: "admin-api POST /api/v1/app/item/alerts/slack", call: (c) => c.items.addAlertSlack({ item: "item-1" }, dto()) },
  {
    id: "admin-api POST /api/v1/app/item/alerts/webhooks",
    call: (c) => c.items.addAlertWebhook({ item: "item-1" }, dto()),
  },
  { id: "admin-api POST /api/v1/app/item/cancel", call: (c) => c.items.cancel({ item: "item-1" }) },
  {
    id: "admin-api POST /api/v1/app/item/claim",
    query: { item: "item-1" },
    call: (c) => c.items.claim("ownerToken-1", "item-1"),
  },
  { id: "admin-api POST /api/v1/app/item/complete", call: (c) => c.items.complete({ item: "item-1" }, dto()) },
  { id: "admin-api POST /api/v1/app/item/entries", call: (c) => c.items.addEntry({ item: "item-1" }, dto()) },
  { id: "admin-api POST /api/v1/app/item/estimates", call: (c) => c.items.createEstimate({ item: "item-1" }, dto()) },
  {
    id: "admin-api POST /api/v1/app/item/links/{linkUuid}/rotate",
    params: { linkUuid: "linkUuid-1" },
    call: (c) => c.items.rotateLink({ item: "item-1" }, "linkUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/app/item/measurements",
    call: (c) => c.items.addMeasurements({ item: "item-1" }, dto()),
  },
  {
    id: "admin-api POST /api/v1/app/item/measurements/csv",
    call: (c) => c.items.importMeasurementsCsv({ item: "item-1" }, "csv-1"),
  },
  {
    id: "admin-api POST /api/v1/app/item/meeting/advance",
    call: (c) => c.items.advanceMeeting({ item: "item-1" }, dto()),
  },
  { id: "admin-api POST /api/v1/app/item/meeting/end", call: (c) => c.items.endMeeting({ item: "item-1" }) },
  { id: "admin-api POST /api/v1/app/item/meeting/start", call: (c) => c.items.startMeeting({ item: "item-1" }) },
  { id: "admin-api POST /api/v1/app/item/model/copy", call: (c) => c.items.copyModel({ item: "item-1" }) },
  {
    id: "admin-api POST /api/v1/app/item/model/versions",
    call: (c) => c.items.addModelVersion({ item: "item-1" }, dto()),
  },
  { id: "admin-api POST /api/v1/app/item/reopen", call: (c) => c.items.reopen({ item: "item-1" }) },
  { id: "admin-api POST /api/v1/app/items", call: (c) => c.items.createItem(dto()) },
  { id: "admin-api POST /api/v1/app/profile", call: (c) => c.profile.initialize(dto()) },
  {
    id: "admin-api POST /api/v1/data-spaces",
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.dataSpaces.create(dto(), "acme"),
  },
  {
    id: "admin-api POST /api/v1/data-spaces/{slug}/producer-reservations",
    params: { slug: "dataSpaceSlug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.reservations.reserve("dataSpaceSlug-1", dto(), "acme"),
  },
  {
    id: "admin-api POST /api/v1/data-spaces/{slug}/producer-reservations/{producerSlug}/claim",
    params: { slug: "dataSpaceSlug-1", producerSlug: "producerSlug-1" },
    query: { parentCompanySlug: "acme" },
    call: (c) => c.custd.provisioning.reservations.claim("dataSpaceSlug-1", "producerSlug-1", dto(), "acme"),
  },
  { id: "admin-api POST /api/v1/producer-provisioning", call: (c) => c.custd.provisioning.producers.provision(dto()) },
  {
    id: "admin-api POST /api/v1/producer-provisioning/{clientId}/rotate-secret",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.provisioning.producers.rotateSecret("clientId-1"),
  },
  {
    id: "admin-api POST /api/v1/site-domains",
    call: (c) => c.custd.admin.siteDomains.create(dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/attestation",
    params: { domainUuid: "domainUuid-1" },
    query: { companySlug: "acme" },
    call: (c) => c.custd.admin.siteDomains.attest("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/audit",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.requestAudit("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.createCampaignLink("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/campaign-links/{linkUuid}/archive",
    params: { domainUuid: "domainUuid-1", linkUuid: "linkUuid-1" },
    call: (c) => c.custd.admin.siteDomains.archiveCampaignLink("domainUuid-1", "linkUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/submissions",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.submitIndexNow("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/indexnow/verify",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.verifyIndexNowKey("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/page-check",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.checkPage("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/page-rechecks",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.requestPageRecheck("domainUuid-1", "url-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/rankings/keywords",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.trackKeyword("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/report-shares",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.createReportShare("domainUuid-1", {}, { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/robots-test",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.testRobots("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/saved-reports",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.saveReport("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/search/inspections",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.requestSearchInspection("domainUuid-1", "url-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/search/{provider}/retry",
    params: { domainUuid: "domainUuid-1", provider: "google" },
    call: (c) => c.custd.admin.siteDomains.retrySearchImport("domainUuid-1", "google", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/status-page/preview",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.previewStatusPage("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/status-page/updates",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.postStatusPageUpdate("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/verify",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.verify("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/wording-compare",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.compareWording("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  { id: "admin-api POST /api/v1/tenant-storage-locations", call: (c) => c.custd.admin.tenantStorage.create() },
  {
    id: "admin-api PUT /api/v1/admin/event-schemas/{schemaUuid}/field-data-labels",
    params: { schemaUuid: "schemaUuid-1" },
    call: (c) => c.custd.admin.dataLabels.setSchemaFieldAssignment("schemaUuid-1", dto()),
  },
  {
    id: "admin-api PUT /api/v1/admin/event-types/{slug}/data-label-defaults/{definitionUuid}",
    params: { slug: "slug-1", definitionUuid: "definitionUuid-1" },
    call: (c) => c.custd.admin.dataLabels.setEventTypeDefault("slug-1", "definitionUuid-1", dto()),
  },
  { id: "admin-api PUT /api/v1/admin/privacy/rules", call: (c) => c.custd.admin.privacy.setRules(dto()) },
  {
    id: "admin-api PUT /api/v1/admin/reporting-packs/drafts/{draftId}",
    params: { draftId: "draftId-1" },
    call: (c) => c.custd.admin.reportingPacks.updateDraft("draftId-1", dto()),
  },
  {
    id: "admin-api PUT /api/v1/admin/retention/policies/{tenantSlug}",
    params: { tenantSlug: "tenantSlug-1" },
    call: (c) => c.custd.admin.retention.upsert("tenantSlug-1", dto()),
  },
  {
    id: "admin-api PUT /api/v1/app/item/alerts/subscription",
    call: (c) => c.items.subscribeAlertEmail({ item: "item-1" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/ai-settings",
    call: (c) => c.custd.admin.siteDomains.setAISettings(dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/ai-settings/consent",
    call: (c) => c.custd.admin.siteDomains.setAIConsent(dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/alert-destination",
    call: (c) =>
      c.custd.admin.siteDomains.setAlertDestination(
        { siteUuid: "siteUuid-1", emailRecipient: "" },
        { companySlug: "acme" },
      ),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/project-context",
    call: (c) => c.custd.admin.siteDomains.setProjectContext({ siteUuid: "siteUuid-1" }, { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/search-pool",
    call: (c) => c.custd.admin.siteDomains.setSearchPool(true, "terms-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/analytics/ga4",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.connectAnalytics("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/checks",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.setCheckMode("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/indexnow",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.enableIndexNow("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/lighthouse/pages",
    params: { domainUuid: "domainUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.setLighthousePages("domainUuid-1", ["https://example.com/"], { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/probes",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.setProbes("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/rankings/keywords/{keywordUuid}",
    params: { domainUuid: "domainUuid-1", keywordUuid: "keywordUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.updateTrackedKeyword("domainUuid-1", "keywordUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/saved-reports/{reportUuid}",
    params: { domainUuid: "domainUuid-1", reportUuid: "reportUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.replaceSavedReport("domainUuid-1", "reportUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/search/{provider}",
    params: { domainUuid: "domainUuid-1", provider: "google" },
    call: (c) => c.custd.admin.siteDomains.connectSearch("domainUuid-1", "google", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/status-page",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.publishStatusPage("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  { id: "analytics-api GET /api/v1/app/forecast/latest", call: (c) => c.items.latestForecast({ item: "item-1" }) },
  {
    id: "analytics-api GET /api/v1/app/forecast/runs/{runUuid}",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.items.forecastRun({ item: "item-1" }, "runUuid-1"),
  },
  { id: "analytics-api GET /api/v1/app/forecast/story", call: (c) => c.items.forecastStory({ item: "item-1" }) },
  { id: "analytics-api GET /api/v1/app/models/latest", call: (c) => c.items.latestModelRun({ item: "item-1" }) },
  {
    id: "analytics-api GET /api/v1/reporting/dashboards/{key}",
    params: { key: "key-1" },
    call: (c) => c.custd.reporting.dashboard("key-1"),
  },
  { id: "analytics-api GET /api/v1/reporting/outputs", call: (c) => c.custd.reporting.outputs() },
  { id: "analytics-api POST /api/v1/analytics/query", call: (c) => c.custd.analytics.query(dto()) },
  { id: "analytics-api POST /api/v1/app/forecast/runs", call: (c) => c.items.runForecast({ item: "item-1" }) },
  {
    id: "analytics-api POST /api/v1/app/models/calculate",
    call: (c) => c.items.calculateModel({ item: "item-1" }, dto()),
  },
  { id: "analytics-api POST /api/v1/app/models/runs", call: (c) => c.items.runModel({ item: "item-1" }, dto()) },
  { id: "analytics-api POST /api/v1/reporting/query", call: (c) => c.custd.reporting.query(dto()) },
  {
    id: "schema-registry DELETE /api/v1/parsers/{uuid}",
    params: { uuid: "uuid-1" },
    call: (c) => c.custd.parsers.delete("uuid-1"),
  },
  { id: "schema-registry GET /api/v1/parsers", response: () => json([]), call: (c) => c.custd.parsers.list() },
  { id: "schema-registry GET /api/v1/parsers/presets", call: (c) => c.custd.parsers.listPresets() },
  { id: "schema-registry POST /api/v1/parsers", call: (c) => c.custd.parsers.create(dto()) },
  { id: "schema-registry POST /api/v1/schemas/dry-run", call: (c) => c.custd.schemas.dryRun(dto()) },
  { id: "schema-registry POST /api/v1/schemas/infer", call: (c) => c.custd.schemas.infer(dto()) },
  { id: "schema-registry POST /api/v1/schemas/validate", call: (c) => c.custd.schemas.validate(dto()) },
  {
    id: "schema-registry PUT /api/v1/parsers/{uuid}",
    params: { uuid: "uuid-1" },
    call: (c) => c.custd.parsers.update("uuid-1", dto()),
  },
  // Rows whose arguments must pass the SDK's own input validation.
  {
    id: "admin-api POST /api/v1/admin/data-scopes",
    call: (c) => c.custd.admin.dataScopes.createScope({ code: "scope-1", name: "Scope" }),
  },
  {
    id: "admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}",
    params: { scopeUuid: uuid },
    call: (c) => c.custd.admin.dataScopes.updateScope(uuid, { status: "disabled" }),
  },
  {
    id: "admin-api POST /api/v1/admin/data-scopes/{scopeUuid}/resources",
    params: { scopeUuid: uuid },
    call: (c) => c.custd.admin.dataScopes.createResource(uuid, { code: "resource-1", name: "Resource" }),
  },
  {
    id: "admin-api PATCH /api/v1/admin/data-scopes/{scopeUuid}/resources/{resourceUuid}",
    params: { scopeUuid: uuid, resourceUuid: uuid },
    call: (c) => c.custd.admin.dataScopes.updateResource(uuid, uuid, { name: "Resource" }),
  },
  {
    id: "admin-api GET /api/v1/admin/data-scope-grants",
    call: (c) => c.custd.admin.dataScopes.listGrants({ kind: "human", userUuid: uuid }),
  },
  { id: "admin-api POST /api/v1/admin/data-scope-grants", call: (c) => c.custd.admin.dataScopes.createGrant(grant) },
  {
    id: "admin-api POST /api/v1/admin/data-scope-grants/revoke",
    call: (c) => c.custd.admin.dataScopes.revokeGrant(grant),
  },
  {
    id: "admin-api PUT /api/v1/admin/tenant-manifest/{tenantSlug}",
    params: { tenantSlug: "tenant-1" },
    call: (c) => c.custd.admin.clientSetup.apply("tenant-1", {}, idempotent),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/page-rechecks",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listPageRechecks("domainUuid-1", ["recheck-1"], { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/keyword-lists",
    call: (c) =>
      c.custd.admin.siteDomains.saveKeywordList({ name: "list-1", keywords: ["shoes"] }, "siteUuid-1", {
        companySlug: "acme",
      }),
  },
  {
    id: "admin-api GET /api/v1/admin/audit/events/export",
    response: auditExport,
    call: (c) => c.custd.admin.audit.exportEvents(auditFilter, "csv"),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans",
    call: (c) => c.custd.admin.timePlans.create("acme", { planKey: "plan-1", name: "Plan", definition: timePlan }),
  },
  {
    id: "admin-api POST /api/v1/admin/time-plans/preview",
    call: (c) => c.custd.admin.timePlans.preview("acme", timePlan),
  },
  {
    id: "admin-api PATCH /api/v1/admin/time-plans/{planUuid}",
    params: { planUuid: "plan-1" },
    call: (c) =>
      c.custd.admin.timePlans.revise("acme", "plan-1", {
        planKey: "plan-1",
        name: "Plan",
        definition: timePlan,
        expectedRevision: 1,
      }),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects",
    call: (c) => c.custd.admin.authProjects.createProject(dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions/revoke",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) =>
      c.custd.admin.authProjects.revokePrincipalSession(
        "project-1",
        "environment-1",
        "directory-1",
        "subject-1",
        dto(),
        idempotent,
      ),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/sessions/revoke-all",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) =>
      c.custd.admin.authProjects.revokePrincipalSessions(
        "project-1",
        "environment-1",
        "directory-1",
        "subject-1",
        dto(),
        idempotent,
      ),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/suspend",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.suspendPrincipal(principal, idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/restore",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.restorePrincipal(principal, idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/erase",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.erasePrincipal(principal, dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/apply",
    params: { projectId: "project-1", environmentId: "environment-1" },
    call: (c) =>
      c.custd.admin.authProjects.applyEnvironmentDesiredState("project-1", "environment-1", dto(), idempotent),
  },
  { id: "admin-api POST /api/v1/admin/apps", call: (c) => c.custd.admin.authProjects.createApp(dto(), idempotent) },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{action}",
    params: { projectId: "project-1", environmentId: "environment-1", action: "enable" },
    call: (c) => c.custd.admin.authProjects.actOnDirectory("project-1", "environment-1", "enable", dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/clients/reconcile",
    params: { projectId: "project-1", environmentId: "environment-1" },
    call: (c) =>
      c.custd.admin.authProjects.reconcileEnvironmentClients("project-1", "environment-1", dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations",
    params: { projectId: "project-1", environmentId: "environment-1" },
    call: (c) => c.custd.admin.authProjects.issueInvitation("project-1", "environment-1", dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/revoke",
    params: { projectId: "project-1", environmentId: "environment-1" },
    call: (c) => c.custd.admin.authProjects.revokeInvitation("project-1", "environment-1", dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/invitations/redeliver",
    params: { projectId: "project-1", environmentId: "environment-1" },
    call: (c) => c.custd.admin.authProjects.redeliverInvitation("project-1", "environment-1", dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences/grant",
    params: { projectId: "project-1", environmentId: "environment-1", providerSubject: "subject-1" },
    call: (c) => c.custd.admin.authProjects.grantPrincipalAudience(principal, dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/principals/{providerSubject}/audiences/revoke",
    params: { projectId: "project-1", environmentId: "environment-1", providerSubject: "subject-1" },
    call: (c) => c.custd.admin.authProjects.revokePrincipalAudience(principal, dto(), idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/directories/{directoryId}/principals/{providerSubject}/profile",
    params: {
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      providerSubject: "subject-1",
    },
    call: (c) => c.custd.admin.authProjects.setPrincipalProfile(principal, dto(), idempotent),
  },
  {
    id: "analytics-api POST /api/v1/reporting/exports",
    call: (c) => c.custd.reporting.createExport({ dashboardKey: "executive", formats: ["csv"], parameters: {} }),
  },
  { id: "analytics-api GET /api/v1/reporting/exports", call: (c) => c.custd.reporting.listExports() },
  {
    id: "analytics-api GET /api/v1/reporting/exports/{exportID}",
    params: { exportID: uuid },
    call: (c) => c.custd.reporting.getExport(uuid),
  },
  {
    id: "analytics-api POST /api/v1/reporting/exports/{exportID}/cancel",
    params: { exportID: uuid },
    call: (c) => c.custd.reporting.cancelExport(uuid),
  },
  {
    id: "analytics-api GET /api/v1/reporting/exports/{exportID}/artifacts/{artifactID}",
    params: { exportID: uuid, artifactID: uuid },
    response: () => new Response(new Uint8Array([1])),
    call: (c) => c.custd.reporting.downloadExport(uuid, uuid),
  },
  {
    id: "analytics-api GET /api/v1/processing/{receiptUuid}",
    params: { receiptUuid: uuid },
    call: (c) => c.custd.reporting.receipt(uuid),
  },
  {
    id: "analytics-api GET /api/v1/reporting/outputs/{outputUuid}",
    params: { outputUuid: uuid },
    call: (c) => c.custd.reporting.output(uuid),
  },
  {
    id: "analytics-api POST /api/v1/reporting/outputs/{outputUuid}/query",
    params: { outputUuid: uuid },
    call: (c) => c.custd.reporting.queryOutput(uuid, dto()),
  },
  {
    id: "analytics-api POST /api/v1/reporting/insights/subject",
    call: (c) => c.custd.reporting.subjectInsight(subjectInsight),
  },
  {
    id: "analytics-api POST /api/v1/analytics/query-range",
    call: (c) => c.custd.analytics.queryRange({ from: "2026-09-14", to: "2026-09-15" }),
  },
  {
    id: "ingest-api ANY /api/v1/parser-preview",
    method: "POST",
    call: (c) => c.custd.parsers.preview(dto({ parser: {} })),
  },
  { id: "ingest-api ANY /api/v1/events", method: "POST", call: (c) => c.custd.ingestEvent(event) },
  { id: "ingest-api ANY /api/v1/events/batch", method: "POST", call: (c) => batchClient(c).flush() },
  {
    id: "ingest-api ANY /api/v1/raw",
    method: "POST",
    response: () => json({ success: true, processed: 1, failed: 0 }),
    call: (c) => c.custd.ingestRawLines({ content: "line\n", parserUuid: uuid }),
  },
  {
    id: "ingest-api ANY /api/v1/errors/api/{project}/envelope/",
    method: "POST",
    params: { project: "1" },
    call: (c) => c.errors.captureException({ error: new Error("boom") }),
  },
  {
    id: "admin-api GET /api/v1/sites/{siteUuid}/config",
    params: { siteUuid: "site-1" },
    call: (c) => fetchBrowserSiteConfig("http://localhost:8080", "site-1", c.fetch),
  },
  { id: "admin-api PUT /api/v1/app/profile/photo", call: (c) => c.profile.uploadPhoto(pngPhoto()) },
  { id: "admin-api POST /api/v1/app/profile/photo", call: (c) => c.profile.initializePhoto(pngPhoto()) },
  {
    id: "admin-api POST /api/v1/admin/tenants/{slug}/finalize",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.finalize("slug-1", 7),
  },
  {
    id: "admin-api POST /api/v1/admin/tenants/{slug}/historical-cleanup",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.historicalCleanup("slug-1", 7, idempotent),
  },
  {
    id: "admin-api GET /api/v1/admin/tenants/{slug}/data-space-entitlement",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.getDataSpaceEntitlement("slug-1"),
  },
  {
    id: "admin-api PUT /api/v1/admin/tenants/{slug}/data-space-entitlement",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.updateDataSpaceEntitlement("slug-1", dto()),
  },
  {
    id: "admin-api PUT /api/v1/admin/tenants/{slug}/storage-limit",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.tenants.updateStorageLimit("slug-1", dto()),
  },
  { id: "admin-api GET /api/v1/data-spaces/usage", call: (c) => c.custd.provisioning.dataSpaces.usage("acme") },
  {
    id: "admin-api GET /api/v1/producer-provisioning/{clientId}",
    params: { clientId: "clientId-1" },
    call: (c) => c.custd.provisioning.producers.get("clientId-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/apps/{slug}/deploy-credentials",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.authProjects.listAppDeployCredentials("slug-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/apps/{slug}/pause",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.authProjects.pauseApp("slug-1", idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/apps/{slug}/resume",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.authProjects.resumeApp("slug-1", idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/apps/{slug}/repair",
    params: { slug: "slug-1" },
    call: (c) => c.custd.admin.authProjects.repairApp("slug-1", idempotent),
  },
  {
    id: "admin-api POST /api/v1/admin/apps/{slug}/sign-in",
    params: { slug: "slug-1" },
    call: (c) =>
      c.custd.admin.authProjects.setAppSignIn("slug-1", { mode: "invite_only", expectedRevision: 3 }, idempotent),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/app-links",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.listEnvironmentAppLinks("project-1", "environment-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.getEnvironmentAuthDomain("project-1", "environment-1"),
  },
  {
    id: "admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.bindEnvironmentAuthDomain("project-1", "environment-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/mint",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.mintEnvironmentAuthDomain("project-1", "environment-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/admit",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.admitEnvironmentAuthDomain("project-1", "environment-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/retry",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.retryEnvironmentAuthDomain("project-1", "environment-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/disable",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.disableEnvironmentAuthDomain("project-1", "environment-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/release",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.releaseEnvironmentAuthDomain("project-1", "environment-1"),
  },
  {
    id: "admin-api PUT /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.setEnvironmentAuthDomainImageOverride("project-1", "environment-1", dto()),
  },
  {
    id: "admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/domain/image-override",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.clearEnvironmentAuthDomainImageOverride("project-1", "environment-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.setAuthProjectBrandLogo("project-1", "environment-1", pngPhoto()),
  },
  {
    id: "admin-api DELETE /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/brand/logo",
    params: environmentParams,
    call: (c) => c.custd.admin.authProjects.clearAuthProjectBrandLogo("project-1", "environment-1"),
  },
  {
    id: "ingest-api POST /api/v1/collect/events",
    call: (c) => withBrowserTracker(c, {}, (tracker) => tracker.trackPageView()),
  },
  {
    id: "ingest-api POST /api/v1/collect/events/batch",
    response: () => json({ success: true, results: [{ success: true, status: 202 }] }),
    call: (c) =>
      withBrowserTracker(c, { batchSize: 2 }, async (tracker) => {
        await tracker.trackPageView();
        await tracker.flush();
      }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/approval",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.withdrawApproval("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/finding-dismissals/{dismissalUuid}",
    params: { domainUuid: "domainUuid-1", dismissalUuid: "dismissalUuid-1" },
    call: (c) => c.custd.admin.siteDomains.restoreFinding("domainUuid-1", "dismissalUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}",
    params: { domainUuid: "domainUuid-1", monitorUuid: "monitorUuid-1" },
    call: (c) => c.custd.admin.siteDomains.deleteHeartbeat("domainUuid-1", "monitorUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/maintenance/{windowUuid}",
    params: { domainUuid: "domainUuid-1", windowUuid: "windowUuid-1" },
    call: (c) => c.custd.admin.siteDomains.cancelMaintenance("domainUuid-1", "windowUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api DELETE /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}",
    params: { domainUuid: "domainUuid-1", monitorUuid: "monitorUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.deletePrivateUptime("domainUuid-1", "monitorUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/finding-dismissals",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listFindingDismissals("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/heartbeats",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listHeartbeats("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/maintenance",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.listMaintenance("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/site-domains/{domainUuid}/private-uptime",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.getPrivateUptime("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/approval",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.approve("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/finding-dismissals",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.dismissFinding("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.createHeartbeat("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/heartbeats/{monitorUuid}/credential",
    params: { domainUuid: "domainUuid-1", monitorUuid: "monitorUuid-1" },
    call: (c) => c.custd.admin.siteDomains.rotateHeartbeat("domainUuid-1", "monitorUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/incidents/{incidentUuid}/acknowledgment",
    params: { domainUuid: "domainUuid-1", incidentUuid: "incidentUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.acknowledgeIncident("domainUuid-1", "incidentUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/maintenance",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.scheduleMaintenance("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.createPrivateUptime("domainUuid-1", "office-lan", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/check",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.requestPrivateUptime("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/private-uptime/{monitorUuid}/credential",
    params: { domainUuid: "domainUuid-1", monitorUuid: "monitorUuid-1" },
    call: (c) =>
      c.custd.admin.siteDomains.rotatePrivateUptime("domainUuid-1", "monitorUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api POST /api/v1/site-domains/{domainUuid}/uptime-check",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.requestUptimeCheck("domainUuid-1", { companySlug: "acme" }),
  },
  {
    id: "admin-api PUT /api/v1/site-domains/{domainUuid}/browser-collector",
    params: { domainUuid: "domainUuid-1" },
    call: (c) => c.custd.admin.siteDomains.setBrowserCollector("domainUuid-1", dto(), { companySlug: "acme" }),
  },
  {
    id: "admin-api GET /api/v1/admin/users",
    call: (c) =>
      c.custd.admin.users.list({
        companySlug: "acme",
        role: "tenant_admin",
        globalState: "enabled",
        membershipState: "active",
        welcomeStatus: "sent",
        includeEnded: true,
        includeDeleted: true,
      }),
  },
  {
    id: "admin-api GET /api/v1/admin/users/{userUuid}",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.get("userUuid-1", { companySlug: "acme", includeEnded: true }),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/definitions",
    call: (c) => c.custd.admin.workflowTimings.listDefinitions("acme", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}",
    params: { workflowKey: "workflowKey-1" },
    call: (c) => c.custd.admin.workflowTimings.getDefinition("acme", "workflowKey-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/duration-history",
    params: { workflowKey: "workflowKey-1" },
    call: (c) => c.custd.admin.workflowTimings.getDurationHistory("acme", "workflowKey-1", 10),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/evaluation",
    params: { workflowKey: "workflowKey-1" },
    call: (c) => c.custd.admin.workflowTimings.getEvaluation("acme", "workflowKey-1", "series-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/runs",
    call: (c) => c.custd.admin.workflowTimings.listRuns("acme", { workflowKey: "workflowKey-1", limit: 10 }),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.workflowTimings.getRun("acme", "runUuid-1"),
  },
  {
    id: "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}/prediction",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.workflowTimings.getPrediction("acme", "runUuid-1"),
  },
  { id: "admin-api POST /api/v1/admin/users", call: (c) => c.custd.admin.users.create(dto()) },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/disable",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.disable("userUuid-1", { reason: "left", globalUser: true }),
  },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/enable",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.enable("userUuid-1", { roles: ["tenant_admin"], globalUser: true }),
  },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/memberships",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.addMembership("userUuid-1", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/reset-password",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.resetPassword("userUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/restore",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.restore("userUuid-1", "acme", { reason: "returned" }),
  },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/retry-welcome",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.retryWelcome("userUuid-1"),
  },
  {
    id: "admin-api POST /api/v1/admin/users/{userUuid}/soft-delete",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.softDelete("userUuid-1", "acme", { reason: "left" }),
  },
  {
    id: "admin-api POST /api/v1/admin/workflow-timings/corrections",
    call: (c) => c.custd.admin.workflowTimings.correctObservation("acme", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/workflow-timings/observations",
    call: (c) => c.custd.admin.workflowTimings.appendObservation("acme", dto()),
  },
  {
    id: "admin-api POST /api/v1/admin/workflow-timings/observations:batch",
    call: (c) => c.custd.admin.workflowTimings.appendObservations("acme", []),
  },
  {
    id: "admin-api POST /api/v1/admin/workflow-timings/runs/{runUuid}/rebuild",
    params: { runUuid: "runUuid-1" },
    call: (c) => c.custd.admin.workflowTimings.rebuildRun("acme", "runUuid-1"),
  },
  {
    id: "admin-api PUT /api/v1/admin/users/{userUuid}",
    params: { userUuid: "userUuid-1" },
    call: (c) => c.custd.admin.users.update("userUuid-1", { roles: ["tenant_admin"] }),
  },
  {
    id: "admin-api PUT /api/v1/admin/workflow-timings/definitions/{workflowKey}",
    params: { workflowKey: "workflowKey-1" },
    call: (c) => c.custd.admin.workflowTimings.reconcileDefinition("acme", dto({ workflowKey: "workflowKey-1" })),
  },
];

// Operations whose SDK method validates or reshapes the response at runtime. Each must decode the
// operation's minimal (required fields, null lists) and maximal example. Every other row only casts
// the parsed JSON, so decoding its example proves nothing. The measurement observation imports are
// left out on purpose: they reject a result count that differs from the submitted rows, which the
// minimal example's null results always do.
const baselineDecoded = [
  "analytics-api GET /api/v1/reporting/exports",
  "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/outcomes",
  "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/runs",
  "admin-api GET /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/threshold-events",
  "admin-api GET /api/v1/admin/measurement/predictions/sources",
  "admin-api GET /api/v1/admin/subject-exports",
  "admin-api GET /api/v1/admin/subject-exports/{requestId}",
  "admin-api POST /api/v1/admin/subject-exports",
  "admin-api POST /api/v1/admin/subject-exports/{requestId}/cancel",
  "admin-api POST /api/v1/admin/subject-exports/{requestId}/force",
  "admin-api GET /api/v1/admin/privacy/erasures",
  "admin-api GET /api/v1/admin/privacy/rules",
  "admin-api PUT /api/v1/admin/privacy/rules",
  "admin-api GET /api/v1/admin/privacy/identifiers/{companySlug}",
  "admin-api GET /api/v1/admin/retention/policies",
  "admin-api GET /api/v1/admin/retention/policies/{tenantSlug}",
  "admin-api PUT /api/v1/admin/retention/policies/{tenantSlug}",
  "admin-api GET /api/v1/admin/schema/audit",
  "admin-api GET /api/v1/admin/measurement/projects",
  "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}",
  "admin-api POST /api/v1/admin/measurement/projects",
  "admin-api DELETE /api/v1/app/profile/photo",
  "admin-api GET /api/v1/admin/apps/{slug}/deploy-credentials",
  "admin-api GET /api/v1/admin/audit/events",
  "admin-api GET /api/v1/admin/audit/events/{eventId}",
  "admin-api GET /api/v1/admin/auth-projects/{projectId}/environments/{environmentId}/app-links",
  "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/receipt",
  "admin-api GET /api/v1/admin/reporting-packs/audit-events",
  "admin-api GET /api/v1/admin/sites",
  "admin-api GET /api/v1/admin/usage/me",
  "admin-api GET /api/v1/admin/users",
  "admin-api GET /api/v1/admin/workflow-timings/definitions",
  "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}",
  "admin-api GET /api/v1/admin/workflow-timings/definitions/{workflowKey}/duration-history",
  "admin-api GET /api/v1/admin/workflow-timings/runs",
  "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}",
  "admin-api GET /api/v1/admin/workflow-timings/runs/{runUuid}/prediction",
  "admin-api GET /api/v1/app/item",
  "admin-api GET /api/v1/app/profile",
  "admin-api GET /api/v1/data-spaces/usage",
  "admin-api GET /api/v1/producer-provisioning",
  "admin-api GET /api/v1/producer-provisioning/{clientId}",
  "admin-api PATCH /api/v1/producer-provisioning/{clientId}/environment",
  "admin-api GET /api/v1/site-domains/{domainUuid}/finding-dismissals",
  "admin-api GET /api/v1/site-domains/{domainUuid}/heartbeats",
  "admin-api GET /api/v1/site-domains/{domainUuid}/maintenance",
  "admin-api GET /api/v1/tenant-storage-locations",
  "admin-api GET /api/v1/tenant-storage-locations/{id}",
  "admin-api PATCH /api/v1/app/profile",
  "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/execute",
  "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/preview",
  "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/retry",
  "admin-api POST /api/v1/admin/users/{userUuid}/reset-password",
  "admin-api POST /api/v1/admin/workflow-timings/corrections",
  "admin-api POST /api/v1/admin/workflow-timings/observations",
  "admin-api POST /api/v1/admin/workflow-timings/observations:batch",
  "admin-api POST /api/v1/admin/workflow-timings/runs/{runUuid}/rebuild",
  "admin-api POST /api/v1/app/profile",
  "admin-api POST /api/v1/app/profile/photo",
  "admin-api PUT /api/v1/admin/workflow-timings/definitions/{workflowKey}",
  "admin-api PUT /api/v1/app/profile/photo",
  "analytics-api GET /api/v1/app/forecast/latest",
  "analytics-api GET /api/v1/app/forecast/runs/{runUuid}",
  "analytics-api GET /api/v1/app/forecast/story",
  "analytics-api GET /api/v1/app/models/latest",
  "analytics-api POST /api/v1/analytics/query-range",
  "analytics-api POST /api/v1/reporting/insights/subject",
  "analytics-api POST /api/v1/reporting/query",
];

const areas: RowArea[] = [
  { rows: baselineRows, decoded: baselineDecoded },
  coreRows,
  ingestRows,
  measurementRows,
  notifyRows,
  operatorRows,
  publicRows,
];
const rows = areas.flatMap((area) => area.rows);
const decodedOperations = areas.flatMap((area) => area.decoded);

describe("route conformance", () => {
  it("covers exactly the operations in coverage/js.json, each once and each required", () => {
    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...coverage].sort());
    expect(coverage).toEqual([...coverage].sort());
    for (const id of ids) expect(operations.get(id)?.sdk, id).toBe("required");
  });

  it.each(rows.map((row) => [row.id, row] as const))("%s", async (_, row) => {
    const operation = operations.get(row.id);
    if (!operation) throw new Error(`${row.id} is not in operations.json`);
    const requests: RecordedRequest[] = [];
    const respond = row.response ?? (() => json(example(operation)?.maximal));
    await row.call(newClients(respond, requests));

    expect(requests).toHaveLength(1);
    const [request] = requests;
    const method = operation.method === "ANY" ? row.method : operation.method;
    expect(method, "an ANY operation row states the method it sends").toBeDefined();
    const url = new URL(request?.url ?? "");
    expect(`${request?.method} ${url.pathname}`).toBe(`${method} ${expectedPath(operation, row.params)}`);
    for (const [name, value] of Object.entries(row.query ?? {})) expect(url.searchParams.get(name), name).toBe(value);
    const unsent = (operation.query ?? []).filter(
      (parameter) =>
        !url.searchParams.has(parameter.name) &&
        (parameter.required ||
          (!actingCompanyCarries(operation, parameter.name) && !unsentQueryReasons[row.id]?.[parameter.name])),
    );
    expect(
      unsent.map((parameter) => parameter.name),
      "declared query parameters the row does not send",
    ).toEqual([]);
  });

  // Admin routes take companySlug from the client's actingCompanySlug, so a row need not pass it.
  it.each(rows.filter((row) => actingCompanyRow(row)).map((row) => [row.id, row] as const))(
    "%s sends the acting company",
    async (_, row) => {
      const operation = operations.get(row.id);
      if (!operation) throw new Error(`${row.id} is not in operations.json`);
      const respond = row.response ?? (() => json(example(operation)?.maximal));
      const companySlug = async (acting?: string) => {
        const requests: RecordedRequest[] = [];
        await row.call(newClients(respond, requests, acting));
        return new URL(requests[0]?.url ?? "").searchParams.get("companySlug");
      };
      const own = await companySlug();
      expect(await companySlug("acting-co")).toBe(own ?? "acting-co");
    },
  );
});

// Optional query parameters one row cannot send, each with why the method still can.
const unsentQueryReasons: Record<string, Record<string, string>> = {
  "admin-api GET /api/v1/admin/data-scope-grants": {
    clientId: "names a machine principal; listGrants sends it for kind machine and userUuid for kind human",
  },
};

function actingCompanyCarries(operation: Operation, name: string): boolean {
  return name === "companySlug" && operation.path.startsWith("/api/v1/admin/");
}

function actingCompanyRow(row: Row): boolean {
  const operation = operations.get(row.id);
  return operation?.query?.some((parameter) => actingCompanyCarries(operation, parameter.name)) ?? false;
}

describe("decode conformance", () => {
  it.each(decodedOperations)("%s decodes its minimal and maximal example", async (id) => {
    const row = rows.find((candidate) => candidate.id === id);
    const operation = operations.get(id);
    const examples = operation && example(operation);
    if (!row || !examples) throw new Error(`${id} needs a route row and an example`);
    for (const body of [examples.minimal, examples.maximal]) {
      await row.call(newClients(() => json(body), []));
    }
  });
});

/** Every path where the minimal example sends null for a field the maximal example fills with a list. */
function nullListPaths(minimal: unknown, maximal: unknown, prefix: string[] = []): string[][] {
  if (typeof minimal !== "object" || minimal === null || typeof maximal !== "object" || maximal === null) return [];
  if (Array.isArray(minimal) || Array.isArray(maximal)) return [];
  const full = maximal as Record<string, unknown>;
  return Object.entries(minimal).flatMap(([key, value]) =>
    value === null && Array.isArray(full[key]) ? [[...prefix, key]] : nullListPaths(value, full[key], [...prefix, key]),
  );
}

function valueAt(value: unknown, path: string[]): { found: boolean; value?: unknown } {
  let node = value;
  for (const key of path) {
    if (typeof node !== "object" || node === null || !(key in node)) return { found: false };
    node = (node as Record<string, unknown>)[key];
  }
  return { found: true, value: node };
}

// A method that refuses the minimal example's empty list, with where the null list is proven instead.
const nullListRefusals: Record<string, string> = {
  "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:bulk":
    "one result per submitted row is required; admin.test.ts proves a null list counts as none",
  "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/observations:csv":
    "one result per submitted row is required; admin.test.ts proves a null list counts as none",
};

const nullListRows = rows.filter(
  (row) => !row.response && operations.get(row.id)?.example && !nullListRefusals[row.id],
);

describe("null list conformance", () => {
  // Go sends a nil list as null; every result shows it as an empty list. A key the SDK renames or
  // unwraps is absent from its result and proven by its own decode.
  it.each(nullListRows.map((row) => [row.id, row] as const))("%s decodes a null list as empty", async (id, row) => {
    const operation = operations.get(id);
    const examples = operation && example(operation);
    if (!examples) throw new Error(`${id} needs an example`);
    const paths = nullListPaths(examples.minimal, examples.maximal);
    if (paths.length === 0) return;
    let decoded = await row.call(newClients(() => json(examples.minimal), []));
    if (typeof decoded === "object" && decoded !== null && "etag" in decoded && "data" in decoded) {
      decoded = decoded.data;
    }
    for (const path of paths) {
      const found = valueAt(decoded, path);
      if (found.found) expect(found.value, path.join(".")).toEqual([]);
    }
  });
});

type WireRecord = Record<string, unknown>;

function maximalExample(id: string): WireRecord {
  const operation = operations.get(id);
  const examples = operation && example(operation);
  if (!examples) throw new Error(`${id} needs an example`);
  return examples.maximal as WireRecord;
}

async function decodeMaximal(id: string): Promise<unknown> {
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`${id} needs a route row`);
  return row.call(newClients(() => json(maximalExample(id)), []));
}

const receiptOperations = [
  "admin-api GET /api/v1/admin/offboarding/requests/{requestUuid}/receipt",
  "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/execute",
  "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/retry",
  "admin-api POST /api/v1/admin/tenants/{slug}/historical-cleanup",
];
const previewOperation = "admin-api POST /api/v1/admin/offboarding/requests/{requestUuid}/preview";

describe("field conformance", () => {
  it.each(receiptOperations)("%s maps every receipt field the server sends", async (id) => {
    const wire = maximalExample(id);
    const perStore = wire.per_store as WireRecord[];
    expect(perStore.length).toBeGreaterThan(0);
    expect(await decodeMaximal(id)).toEqual({
      companyId: wire.company_id,
      requestedByKind: wire.requested_by_kind,
      requestedAt: wire.requested_at,
      completedAt: wire.completed_at,
      finalState: wire.final_state,
      perStore: perStore.map((store) => ({
        store: store.store,
        retentionClass: store.retention_class,
        deletedCount: store.deleted_count,
        retainedExceptionsCount: store.retained_exceptions_count,
      })),
      waiver: wire.waiver,
      sha256: wire.sha256,
    });
  });

  it("maps every offboarding preview field the server sends", async () => {
    const { stores, ...wire } = maximalExample(previewOperation);
    expect((stores as WireRecord[]).length).toBeGreaterThan(0);
    expect(await decodeMaximal(previewOperation)).toEqual({
      ...wire,
      stores: (stores as WireRecord[]).map((store) => ({
        store: store.store,
        kind: store.kind,
        retentionClass: store.retention_class,
        estimatedCount: store.estimated_count,
        sourceAuthority: store.source_authority,
      })),
    });
  });
});

/** Every key path of a JSON value; a list contributes its first item's paths. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.length > 0 ? keyPaths(value[0], `${prefix}[]`) : [];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [`${prefix}.${key}`, ...keyPaths(child, `${prefix}.${key}`)]);
}

// The SDK renames these snake_case responses to camelCase, proven field by field above.
const renamedResponses = new Set([...receiptOperations, previewOperation]);

describe("field retention", () => {
  // Response types are erased at runtime, so this proves the half a cast cannot: no decoder drops a
  // field the server sends. A conditional read is checked through its data.
  it("every decoded result keeps every field of its maximal example", async () => {
    const lost: string[] = [];
    for (const row of rows) {
      const operation = operations.get(row.id);
      const body = operation && example(operation)?.maximal;
      if (row.response || renamedResponses.has(row.id) || typeof body !== "object" || body === null) continue;
      let result = await row.call(newClients(() => json(body), []));
      if (typeof result === "object" && result !== null && "etag" in result && "data" in result) result = result.data;
      if (typeof result !== "object" || result === null) continue;
      const kept = new Set(keyPaths(result));
      const dropped = keyPaths(body).filter((path) => !kept.has(path));
      if (dropped.length > 0) lost.push(`${row.id}: ${dropped.join(", ")}`);
    }
    expect(lost).toEqual([]);
  });
});
