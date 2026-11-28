import { dto, type RowArea } from "./surface-conformance.test-helper";

const jobUuid = "jobUuid-1";

function reply(body: unknown): () => Response {
  return () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

const pool = { available: true, active: 0, waiting: 0, walBytes: 0, writeStatements: null };
const snapshot = { status: "healthy", pipeline: null, database: { core: pool, raw: pool, bytesPerEvent: 0 } };
const job = {
  jobUuid,
  status: "queued",
  items: null,
  approval: { Identity: "ops", ExpiresAt: "2026-11-27T00:00:00Z" },
};
const plan = {
  planUuid: "plan-1",
  mode: "generated-data",
  scope: { mode: "generated-data", approvedS3Prefixes: null },
};

export const ingestRows: RowArea = {
  rows: [
    { id: "ingest-api ANY /api/v1/account/me", method: "GET", call: (c) => c.custd.ingestOperations.account() },
    { id: "ingest-api POST /api/v1/admin/cleanup", call: (c) => c.custd.ingestOperations.cleanup() },
    {
      id: "ingest-api POST /api/v1/admin/integrity",
      call: (c) => c.custd.ingestOperations.checkIntegrity(),
    },
    {
      id: "ingest-api GET /api/v1/diagnostics/buffers",
      response: reply(snapshot),
      call: (c) => c.custd.ingestOperations.diagnostics("buffers"),
    },
    {
      id: "ingest-api GET /api/v1/diagnostics/database",
      response: reply(snapshot),
      call: (c) => c.custd.ingestOperations.diagnostics("database"),
    },
    {
      id: "ingest-api GET /api/v1/diagnostics/ingest",
      response: reply(snapshot),
      call: (c) => c.custd.ingestOperations.diagnostics("ingest"),
    },
    {
      id: "ingest-api GET /api/v1/diagnostics/reporting",
      response: reply(snapshot),
      call: (c) => c.custd.ingestOperations.diagnostics("reporting"),
    },
    {
      id: "ingest-api GET /api/v1/diagnostics/segments",
      response: reply(snapshot),
      call: (c) => c.custd.ingestOperations.diagnostics("segments"),
    },
    {
      id: "ingest-api POST /api/v1/managed-audit/redactions",
      call: (c) => c.custd.ingestOperations.redactManagedAudit(dto()),
    },
    {
      id: "ingest-api GET /api/v1/monitoring/alerts",
      response: reply(null),
      call: (c) => c.custd.ingestOperations.monitoringAlerts(),
    },
    {
      id: "ingest-api GET /api/v1/monitoring/summary",
      query: { counters: "measured" },
      call: (c) => c.custd.ingestOperations.monitoringSummary("measured"),
    },
    { id: "ingest-api POST /api/v1/reprocess", call: (c) => c.custd.ingestOperations.reprocess() },
    {
      id: "ingest-api GET /api/v1/system/monitoring/summary",
      call: (c) => c.custd.ingestOperations.systemMonitoringSummary(),
    },
    { id: "ingest-api GET /api/v1/admin/cleanup/plans", call: (c) => c.custd.ingestOperations.listCleanupPlans() },
    {
      id: "ingest-api POST /api/v1/admin/cleanup/plans",
      response: reply(plan),
      call: (c) => c.custd.ingestOperations.createCleanupPlan(dto()),
    },
    { id: "ingest-api GET /api/v1/cleanup/jobs", call: (c) => c.custd.ingestOperations.listCleanupJobs() },
    {
      id: "ingest-api POST /api/v1/cleanup/jobs",
      response: reply(job),
      call: (c) => c.custd.ingestOperations.createCleanupJob(dto()),
    },
    {
      id: "ingest-api GET /api/v1/cleanup/jobs/{uuid}",
      params: { uuid: jobUuid },
      response: reply(job),
      call: (c) => c.custd.ingestOperations.getCleanupJob(jobUuid),
    },
    {
      id: "ingest-api POST /api/v1/cleanup/jobs/{uuid}",
      params: { uuid: jobUuid },
      response: reply(job),
      call: (c) => c.custd.ingestOperations.cancelCleanupJob(jobUuid),
    },
    {
      id: "ingest-api GET /api/v1/cleanup/jobs/{uuid}/proof",
      params: { uuid: jobUuid },
      call: (c) => c.custd.ingestOperations.getCleanupJobProof(jobUuid),
    },
  ],
  decoded: [],
};
