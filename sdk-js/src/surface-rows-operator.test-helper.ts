import { dto, type RowArea, usageWindow } from "./surface-conformance.test-helper";

const idempotent = { idempotencyKey: "idempotency-key-1" };

export const operatorRows: RowArea = {
  rows: [
    {
      id: "admin-api GET /api/v1/admin/impersonation-sessions",
      call: (c) => c.custd.admin.impersonation.list(),
    },
    {
      id: "admin-api POST /api/v1/admin/impersonation-sessions",
      call: (c) => c.custd.admin.impersonation.start(dto()),
    },
    {
      id: "admin-api POST /api/v1/admin/impersonation-sessions/{impersonationSessionUuid}/stop",
      params: { impersonationSessionUuid: "session-1" },
      call: (c) => c.custd.admin.impersonation.stop("session-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/impersonation-sessions/{impersonationSessionUuid}/terminate",
      params: { impersonationSessionUuid: "session-1" },
      call: (c) => c.custd.admin.impersonation.terminate("session-1"),
    },
    {
      id: "admin-api GET /api/v1/admin/support-access",
      query: { companySlug: "acme" },
      call: (c) => c.custd.admin.supportAccess.list("acme"),
    },
    { id: "admin-api POST /api/v1/admin/support-access", call: (c) => c.custd.admin.supportAccess.create(dto()) },
    {
      id: "admin-api POST /api/v1/admin/support-access/{supportAccessGrantUuid}/revoke",
      params: { supportAccessGrantUuid: "grant-1" },
      call: (c) => c.custd.admin.supportAccess.revoke("grant-1"),
    },
    { id: "admin-api GET /api/v1/admin/system/status", call: (c) => c.custd.admin.system.status() },
    { id: "admin-api GET /api/v1/admin/jobs", call: (c) => c.custd.admin.system.listJobs() },
    {
      id: "admin-api POST /api/v1/admin/jobs/{jobId}/retry",
      params: { jobId: "42" },
      call: (c) => c.custd.admin.system.retryJob(42),
    },
    { id: "admin-api GET /api/v1/admin/scheduled-tasks", call: (c) => c.custd.admin.system.listScheduledTasks() },
    {
      id: "admin-api GET /api/v1/admin/scheduled-tasks/{taskName}",
      params: { taskName: "task-1" },
      call: (c) => c.custd.admin.system.getScheduledTask("task-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/run",
      params: { taskName: "task-1" },
      call: (c) => c.custd.admin.system.runScheduledTask("task-1", { force: true }),
    },
    {
      id: "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/pause",
      params: { taskName: "task-1" },
      call: (c) => c.custd.admin.system.pauseScheduledTask("task-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/scheduled-tasks/{taskName}/resume",
      params: { taskName: "task-1" },
      call: (c) => c.custd.admin.system.resumeScheduledTask("task-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/scheduled-task-runs/{runUuid}/retry",
      params: { runUuid: "run-1" },
      call: (c) => c.custd.admin.system.retryScheduledTaskRun("run-1"),
    },
    { id: "admin-api GET /api/v1/admin/bootstrap", call: (c) => c.custd.admin.system.getBootstrap() },
    { id: "admin-api POST /api/v1/admin/bootstrap", call: (c) => c.custd.admin.system.submitBootstrap(dto()) },
    {
      id: "admin-api GET /api/v1/admin/environment-policy",
      query: { companySlug: "acme" },
      call: (c) => c.custd.admin.environmentPolicy.get("acme"),
    },
    {
      id: "admin-api PATCH /api/v1/admin/environment-policy",
      query: { companySlug: "acme" },
      call: (c) => c.custd.admin.environmentPolicy.update({ autoCreateEnvironments: true }, "acme"),
    },
    { id: "admin-api GET /api/v1/admin/rls/status", call: (c) => c.custd.admin.rls.status() },
    {
      id: "admin-api POST /api/v1/admin/rls/reconciliation-plans",
      call: (c) => c.custd.admin.rls.createPlan(dto(), idempotent),
    },
    {
      id: "admin-api POST /api/v1/admin/rls/reconciliation-plans/{planUuid}/execute",
      params: { planUuid: "plan-1" },
      call: (c) => c.custd.admin.rls.executePlan("plan-1", {}, idempotent),
    },
    {
      id: "admin-api GET /api/v1/admin/rls/reconciliation-plans/{planUuid}/proof",
      params: { planUuid: "plan-1" },
      call: (c) => c.custd.admin.rls.getPlanProof("plan-1"),
    },
    {
      id: "admin-api GET /api/v1/admin/oauth-client-admissions",
      query: { companySlug: "acme" },
      call: (c) => c.custd.admin.oauthClientAdmissions.list("acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/review",
      params: { admissionUuid: "admission-1" },
      call: (c) => c.custd.admin.oauthClientAdmissions.review("admission-1", { companySlug: "acme" }),
    },
    {
      id: "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/approve",
      params: { admissionUuid: "admission-1" },
      call: (c) => c.custd.admin.oauthClientAdmissions.approve("admission-1", dto()),
    },
    {
      id: "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/revoke",
      params: { admissionUuid: "admission-1" },
      call: (c) =>
        c.custd.admin.oauthClientAdmissions.revoke("admission-1", { companySlug: "acme", expectedRevision: 1 }),
    },
    { id: "admin-api GET /api/v1/admin/sdk-usage", call: (c) => c.custd.admin.sdkUsage.list() },
    {
      id: "admin-api PUT /api/v1/admin/sdk-usage/deprecations/{sdk}/{versionScope}",
      params: { sdk: "js", versionScope: "3.x" },
      call: (c) => c.custd.admin.sdkUsage.putDeprecation("js", "3.x", { recommendedVersion: "4.0.0", note: "upgrade" }),
    },
    {
      id: "admin-api DELETE /api/v1/admin/sdk-usage/deprecations/{sdk}/{versionScope}",
      params: { sdk: "js", versionScope: "3.x" },
      call: (c) => c.custd.admin.sdkUsage.deleteDeprecation("js", "3.x"),
    },
    {
      id: "admin-api GET /api/v1/admin/ingest/claims/{tenantSlug}",
      params: { tenantSlug: "acme" },
      query: { limit: "10" },
      call: (c) => c.custd.admin.ingestClaims.list("acme", 10),
    },
    {
      id: "admin-api POST /api/v1/admin/ingest/claims/{tenantSlug}/{objectUuid}/retry",
      params: { tenantSlug: "acme", objectUuid: "object-1" },
      call: (c) => c.custd.admin.ingestClaims.retry("acme", "object-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/ingest/claims/{tenantSlug}/{objectUuid}/terminal",
      params: { tenantSlug: "acme", objectUuid: "object-1" },
      call: (c) => c.custd.admin.ingestClaims.markTerminal("acme", "object-1", { failureClass: "corrupt" }),
    },
    {
      id: "admin-api GET /api/v1/admin/accounting/evidence",
      query: { limit: "5" },
      call: (c) => c.custd.admin.accountingEvidence.list({ asOf: "2026-11-20T06:00:00Z", limit: 5 }),
    },
    {
      id: "admin-api POST /api/v1/admin/accounting/evidence",
      call: (c) => c.custd.admin.accountingEvidence.create(dto()),
    },
    {
      id: "admin-api GET /api/v1/admin/usage",
      query: { companySlug: "acme" },
      call: (c) => c.custd.admin.usage.listUsage({ companySlug: "acme", ...usageWindow }),
    },
    {
      id: "admin-api GET /api/v1/admin/usage/export",
      query: { companySlug: "acme" },
      call: (c) => c.custd.admin.usage.exportUsage({ companySlug: "acme", ...usageWindow }),
    },
    { id: "admin-api GET /api/v1/admin/storage-usage", call: (c) => c.custd.admin.usage.listStorageUsage() },
    { id: "admin-api GET /api/v1/admin/storage-usage/me", call: (c) => c.custd.admin.usage.getRetainedUsage() },
    { id: "admin-api GET /api/v1/admin/user-roles", call: (c) => c.custd.admin.users.listRoles() },
  ],
  decoded: [
    "admin-api GET /api/v1/admin/accounting/evidence",
    "admin-api GET /api/v1/admin/bootstrap",
    "admin-api GET /api/v1/admin/environment-policy",
    "admin-api GET /api/v1/admin/ingest/claims/{tenantSlug}",
    "admin-api GET /api/v1/admin/jobs",
    "admin-api GET /api/v1/admin/oauth-client-admissions",
    "admin-api GET /api/v1/admin/rls/reconciliation-plans/{planUuid}/proof",
    "admin-api GET /api/v1/admin/rls/status",
    "admin-api GET /api/v1/admin/scheduled-tasks",
    "admin-api GET /api/v1/admin/sdk-usage",
    "admin-api GET /api/v1/admin/storage-usage",
    "admin-api GET /api/v1/admin/support-access",
    "admin-api GET /api/v1/admin/system/status",
    "admin-api GET /api/v1/admin/usage",
    "admin-api GET /api/v1/admin/usage/export",
    "admin-api GET /api/v1/admin/user-roles",
    "admin-api PATCH /api/v1/admin/environment-policy",
    "admin-api POST /api/v1/admin/bootstrap",
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/approve",
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/review",
    "admin-api POST /api/v1/admin/oauth-client-admissions/{admissionUuid}/revoke",
    "admin-api POST /api/v1/admin/rls/reconciliation-plans",
    "admin-api POST /api/v1/admin/rls/reconciliation-plans/{planUuid}/execute",
  ],
};
