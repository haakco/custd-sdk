import { dto, type RowArea } from "./surface-conformance.test-helper";

const acme = { companySlug: "acme" };
const selection = { revision: "revision-1", values: {} };

export const notifyRows: RowArea = {
  rows: [
    {
      id: "admin-api DELETE /api/v1/admin/email-relay/{tenantSlug}",
      params: { tenantSlug: "acme" },
      call: (c) => c.custd.admin.emailRelay.delete("acme"),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api GET /api/v1/admin/email-relay/{tenantSlug}",
      params: { tenantSlug: "acme" },
      call: (c) => c.custd.admin.emailRelay.get("acme"),
    },
    {
      id: "admin-api PUT /api/v1/admin/email-relay/{tenantSlug}",
      params: { tenantSlug: "acme" },
      call: (c) => c.custd.admin.emailRelay.put("acme", dto()),
    },
    {
      id: "admin-api POST /api/v1/admin/email-relay/{tenantSlug}/test-send",
      params: { tenantSlug: "acme" },
      call: (c) => c.custd.admin.emailRelay.testSend("acme", { recipient: "ops@example.com", campaign: selection }),
    },
    {
      id: "admin-api GET /api/v1/admin/notification-webhooks",
      query: acme,
      call: (c) => c.custd.admin.webhooks.list("acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/notification-webhooks",
      call: (c) =>
        c.custd.admin.webhooks.create({
          companySlug: "acme",
          name: "Ops",
          endpoint: "https://example.com",
          enabled: true,
        }),
    },
    {
      id: "admin-api PATCH /api/v1/admin/notification-webhooks/{uuid}",
      params: { uuid: "uuid-1" },
      query: acme,
      call: (c) => c.custd.admin.webhooks.setEnabled("uuid-1", false, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/notification-webhooks/{uuid}/rotate-secret",
      params: { uuid: "uuid-1" },
      query: acme,
      call: (c) => c.custd.admin.webhooks.rotateSecret("uuid-1", "acme"),
    },
    {
      id: "admin-api DELETE /api/v1/admin/notification-webhooks/{uuid}",
      params: { uuid: "uuid-1" },
      query: acme,
      call: (c) => c.custd.admin.webhooks.delete("uuid-1", "acme"),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api GET /api/v1/admin/notification-deliveries/{uuid}",
      params: { uuid: "uuid-1" },
      query: acme,
      call: (c) => c.custd.admin.webhooks.getDelivery("uuid-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/notification-deliveries/{uuid}/replay",
      params: { uuid: "uuid-1" },
      query: acme,
      call: (c) => c.custd.admin.webhooks.replay("uuid-1", { reason: "provider outage" }, "acme"),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api GET /api/v1/notification-destinations/{eventSlug}",
      params: { eventSlug: "error_issue_alert" },
      query: acme,
      call: (c) => c.custd.admin.notificationDestinations.get("error_issue_alert", "acme"),
    },
    {
      id: "admin-api PUT /api/v1/notification-destinations/{eventSlug}",
      params: { eventSlug: "site_incident" },
      query: acme,
      call: (c) =>
        c.custd.admin.notificationDestinations.put("site_incident", { channel: "slack", enabled: true }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-revisions",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.createRevision(dto(), "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/campaign-email-revisions/{revision}",
      params: { revision: "revision-1" },
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.getRevision("revision-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-revisions/{revision}/render",
      params: { revision: "revision-1" },
      call: (c) => c.custd.admin.campaignEmail.renderRevision("revision-1", { slots: {} }),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-runs",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.startRun(dto(), "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/campaign-email-runs/{runId}",
      params: { runId: "runId-1" },
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.getRun("runId-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-runs/{runId}/cancel",
      params: { runId: "runId-1" },
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.cancelRun("runId-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-permissions/check",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.checkPermission({ email: "a@example.com" }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-permissions/confirm",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.confirmPermission(dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-permissions/withdraw",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.withdrawPermission({ email: "a@example.com" }, "acme"),
    },
    {
      id: "admin-api PUT /api/v1/admin/campaign-email-welcome/definition",
      query: acme,
      call: (c) =>
        c.custd.admin.campaignEmail.putWelcomeDefinition(
          { version: "v1", welcome: selection, reminder: selection },
          "acme",
        ),
    },
    {
      id: "admin-api PUT /api/v1/admin/campaign-email-welcome/pause",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.setWelcomePaused({ paused: true }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-welcome/confirmed-signup",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.recordWelcomeConfirmedSignup(dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/campaign-email-welcome/activation",
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.recordWelcomeActivation(dto(), "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/campaign-email-welcome/contacts/{contactId}",
      params: { contactId: "contactId-1" },
      query: acme,
      call: (c) => c.custd.admin.campaignEmail.getWelcomeContact("contactId-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/event-types",
      query: acme,
      call: (c) => c.custd.admin.eventTypes.list("acme"),
    },
    {
      id: "admin-api PATCH /api/v1/admin/event-types/{slug}",
      params: { slug: "page-view" },
      query: acme,
      call: (c) => c.custd.admin.eventTypes.update("page-view", { retentionDays: 30 }, "acme"),
      response: () => new Response(null, { status: 204 }),
    },
    { id: "admin-api GET /api/v1/admin/event-categories", call: (c) => c.custd.admin.eventTypes.listCategories() },
    {
      id: "admin-api PATCH /api/v1/admin/event-categories/{slug}",
      params: { slug: "audit" },
      call: (c) => c.custd.admin.eventTypes.updateCategory("audit", { retentionDays: null, isAudit: true }),
      response: () => new Response(null, { status: 204 }),
    },
    {
      id: "admin-api GET /api/v1/error-issues",
      query: { companySlug: "acme", state: "open", limit: "20" },
      call: (c) => c.custd.admin.errorIssues.list({ companySlug: "acme", state: "open", limit: 20 }),
    },
    {
      id: "admin-api GET /api/v1/error-issues/{issueUuid}",
      params: { issueUuid: "issueUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.errorIssues.get("issueUuid-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/error-issues/{issueUuid}/state",
      params: { issueUuid: "issueUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.errorIssues.setState("issueUuid-1", "resolved", "acme"),
    },
    {
      id: "admin-api POST /api/v1/managed-audit/provision",
      call: (c) =>
        c.custd.admin.managedAudit.provisionProducer({
          companySlug: "acme",
          producerSlug: "audit",
          scopeTemplate: "managed-audit",
        }),
      response: () =>
        new Response(JSON.stringify({ clientId: "client-1", clientSecret: "secret" }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
    },
  ],
  decoded: [
    "admin-api GET /api/v1/admin/campaign-email-runs/{runId}",
    "admin-api GET /api/v1/admin/event-categories",
    "admin-api GET /api/v1/admin/event-types",
    "admin-api GET /api/v1/admin/notification-webhooks",
    "admin-api GET /api/v1/error-issues",
    "admin-api GET /api/v1/error-issues/{issueUuid}",
    "admin-api POST /api/v1/admin/campaign-email-runs",
    "admin-api POST /api/v1/admin/campaign-email-runs/{runId}/cancel",
    "admin-api POST /api/v1/admin/email-relay/{tenantSlug}/test-send",
    "admin-api POST /api/v1/error-issues/{issueUuid}/state",
  ],
};
