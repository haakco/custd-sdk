import { dto, type RowArea } from "./surface-conformance.test-helper";

const project = { projectUuid: "projectUuid-1" };
const decision = { ...project, decisionUuid: "decisionUuid-1" };
const acme = { companySlug: "acme" };

function html(): Response {
  return new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } });
}

function noContent(): Response {
  return new Response(null, { status: 204 });
}

export const measurementRows: RowArea = {
  rows: [
    {
      id: "admin-api DELETE /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
      params: decision,
      query: acme,
      response: noContent,
      call: (c) => c.custd.admin.measurement.projects.deleteDecision("projectUuid-1", "decisionUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.listDecisions("projectUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
      params: decision,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.getDecision("projectUuid-1", "decisionUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/estimates",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.listEstimates("projectUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/imports/{importUuid}",
      params: { ...project, importUuid: "importUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.getImportRun("projectUuid-1", "importUuid-1", "acme"),
    },
    {
      id: "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.update("projectUuid-1", { name: "Renamed" }, "acme"),
    },
    {
      id: "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
      params: decision,
      query: acme,
      call: (c) =>
        c.custd.admin.measurement.projects.updateDecision("projectUuid-1", "decisionUuid-1", { name: "N" }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/duration-evaluations",
      params: { definitionUuid: "definitionUuid-1" },
      query: acme,
      call: (c) =>
        c.custd.admin.predictions.evaluateDurationHistory("acme", "definitionUuid-1", {
          planUuid: "plan-1",
          semanticKey: "focus",
        }),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/calibration-exercises",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.createCalibrationExercise("projectUuid-1", dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/cancel",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.cancel("projectUuid-1", "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/complete",
      params: project,
      query: acme,
      call: (c) =>
        c.custd.admin.measurement.projects.complete("projectUuid-1", { completedAt: "2026-11-20T06:00:00Z" }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/decisions",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.createDecisionModel("projectUuid-1", dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/estimates",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.addEstimate("projectUuid-1", dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/runs",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.addRun("projectUuid-1", { projectCode: "run-2" }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/series",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.addSeries("projectUuid-1", dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/targets",
      params: project,
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.addTarget("projectUuid-1", dto(), "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/targets/{targetUuid}/reopen",
      params: { ...project, targetUuid: "targetUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.measurement.projects.reopenTarget("projectUuid-1", "targetUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/time-plans/operations/definition-math",
      query: acme,
      call: (c) => c.custd.admin.timePlans.getDefinitionMathProof("acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/time-plans/operations/status",
      query: acme,
      call: (c) => c.custd.admin.timePlans.getOperationalStatus("acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/time-plans/operations/outbox/replay",
      query: acme,
      call: (c) => c.custd.admin.timePlans.replayOutbox("acme", { limit: 10 }),
    },
    {
      id: "admin-api GET /api/v1/admin/time-plans/plans/{planUuid}/versions/{versionUuid}",
      params: { planUuid: "planUuid-1", versionUuid: "versionUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.timePlans.getPublishedVersion("acme", "planUuid-1", "versionUuid-1"),
    },
    {
      id: "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/duration-observations",
      params: { runUuid: "runUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.timePlans.listDurationObservations("acme", "runUuid-1"),
    },
    {
      id: "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/predictions",
      params: { runUuid: "runUuid-1" },
      query: { ...acme, limit: "5" },
      call: (c) => c.custd.admin.timePlans.listRunPredictions("acme", "runUuid-1", 5),
    },
    {
      id: "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/report",
      params: { runUuid: "runUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.timePlans.getCompletedDurationReport("acme", "runUuid-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/projection-loss",
      params: { runUuid: "runUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.timePlans.deleteRunProjection("acme", "runUuid-1"),
    },
    {
      id: "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/repair",
      params: { runUuid: "runUuid-1" },
      call: (c) => c.custd.admin.timePlans.repairRun("runUuid-1"),
    },
    {
      id: "admin-api DELETE /api/v1/admin/uncertainty-models/{modelUuid}",
      params: { modelUuid: "modelUuid-1" },
      query: acme,
      response: noContent,
      call: (c) => c.custd.admin.uncertaintyModels.delete("modelUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/uncertainty-models",
      query: { ...acme, source: "admin" },
      call: (c) => c.custd.admin.uncertaintyModels.list("admin", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}",
      params: { modelUuid: "modelUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.uncertaintyModels.get("modelUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions",
      params: { modelUuid: "modelUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.uncertaintyModels.listVersions("modelUuid-1", "acme"),
    },
    {
      id: "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions/{versionNumber}",
      params: { modelUuid: "modelUuid-1", versionNumber: "2" },
      query: acme,
      call: (c) => c.custd.admin.uncertaintyModels.getVersion("modelUuid-1", 2, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/uncertainty-models",
      query: acme,
      call: (c) => c.custd.admin.uncertaintyModels.create({ name: "Model" }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/copy",
      params: { modelUuid: "modelUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.uncertaintyModels.copy("modelUuid-1", { versionNumber: 1 }, "acme"),
    },
    {
      id: "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/versions",
      params: { modelUuid: "modelUuid-1" },
      query: acme,
      call: (c) => c.custd.admin.uncertaintyModels.createVersion("modelUuid-1", { quantities: [] }, "acme"),
    },
    {
      id: "admin-api GET /api/v1/app/item/alerts/unsubscribe",
      query: { token: "token-1" },
      response: html,
      call: (c) => c.items.getAlertUnsubscribePage("token-1"),
    },
    {
      id: "admin-api POST /api/v1/app/item/alerts/unsubscribe",
      response: noContent,
      call: (c) => c.items.unsubscribeAlertEmailByToken({ token: "token-1" }),
    },
    {
      id: "admin-api GET /api/v1/app/item/measurements",
      query: { after: "cursor-1", limit: "10", run: "run-1" },
      call: (c) => c.items.listMeasurements("access-1", { after: "cursor-1", limit: 10, run: "run-1" }),
    },
    {
      id: "admin-api GET /api/v1/app/item/runs",
      query: { item: "item-1", limit: "10" },
      call: (c) => c.items.listRuns({ item: "item-1" }, { limit: 10 }),
    },
    {
      id: "admin-api POST /api/v1/app/item/runs",
      call: (c) => c.items.startRun("access-1", { projectCode: "run-2" }),
    },
    {
      id: "analytics-api GET /api/v1/measurement/overview",
      call: (c) => c.custd.measurement.overview(),
    },
    {
      id: "analytics-api GET /api/v1/measurement/predictions/definitions",
      call: (c) => c.custd.measurement.predictions.listDefinitions(),
    },
    {
      id: "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}",
      params: { definitionUuid: "definitionUuid-1" },
      call: (c) => c.custd.measurement.predictions.getDefinition("definitionUuid-1"),
    },
    {
      id: "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/evaluations",
      params: { definitionUuid: "definitionUuid-1" },
      call: (c) => c.custd.measurement.predictions.getLatestEvaluation("definitionUuid-1"),
    },
    {
      id: "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/outcomes",
      params: { definitionUuid: "definitionUuid-1" },
      call: (c) => c.custd.measurement.predictions.listOutcomes("definitionUuid-1"),
    },
    {
      id: "analytics-api GET /api/v1/measurement/predictions/definitions/{definitionUuid}/runs",
      params: { definitionUuid: "definitionUuid-1" },
      query: { since: "2026-11-20T06:00:00Z" },
      call: (c) => c.custd.measurement.predictions.listRuns("definitionUuid-1", "2026-11-20T06:00:00Z"),
    },
    {
      id: "analytics-api GET /api/v1/measurement/projects/{projectUuid}/decisions/{decisionUuid}/simulation-runs/{runUuid}",
      params: { ...decision, runUuid: "runUuid-1" },
      call: (c) =>
        c.custd.measurement.projects.getDecisionSimulationRun("projectUuid-1", "decisionUuid-1", "runUuid-1"),
    },
    {
      id: "analytics-api POST /api/v1/measurement/projects/{projectUuid}/decisions/{decisionUuid}/simulation-runs",
      params: decision,
      call: (c) => c.custd.measurement.projects.runDecisionSimulation("projectUuid-1", "decisionUuid-1", { seed: 7 }),
    },
    {
      id: "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-runs/{runUuid}",
      params: { ...project, runUuid: "runUuid-1" },
      call: (c) => c.custd.measurement.projects.getForecastRun("projectUuid-1", "runUuid-1"),
    },
    {
      id: "analytics-api POST /api/v1/measurement/projects/{projectUuid}/forecast-runs",
      params: project,
      call: (c) => c.custd.measurement.projects.runForecast("projectUuid-1", { seed: 7 }),
    },
    {
      id: "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-story",
      params: project,
      call: (c) => c.custd.measurement.projects.getForecastStory("projectUuid-1"),
    },
    {
      id: "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs",
      params: { modelUuid: "modelUuid-1" },
      call: (c) => c.custd.measurement.uncertaintyModels.listRuns("modelUuid-1"),
    },
    {
      id: "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs/{runUuid}",
      params: { modelUuid: "modelUuid-1", runUuid: "runUuid-1" },
      call: (c) => c.custd.measurement.uncertaintyModels.getRun("modelUuid-1", "runUuid-1"),
    },
    {
      id: "analytics-api POST /api/v1/measurement/uncertainty-models/{modelUuid}/runs",
      params: { modelUuid: "modelUuid-1" },
      call: (c) => c.custd.measurement.uncertaintyModels.createRun("modelUuid-1", { seed: 7 }),
    },
  ],
  decoded: [
    "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}",
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/complete",
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/cancel",
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/runs",
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions",
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/estimates",
    "admin-api GET /api/v1/admin/measurement/projects/{projectUuid}/imports/{importUuid}",
    "admin-api PATCH /api/v1/admin/measurement/projects/{projectUuid}/decisions/{decisionUuid}",
    "admin-api POST /api/v1/admin/measurement/predictions/definitions/{definitionUuid}/duration-evaluations",
    "admin-api POST /api/v1/admin/measurement/projects/{projectUuid}/decisions",
    "admin-api GET /api/v1/admin/time-plans/operations/definition-math",
    "admin-api GET /api/v1/admin/time-plans/plans/{planUuid}/versions/{versionUuid}",
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/duration-observations",
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/predictions",
    "admin-api GET /api/v1/admin/time-plans/runs/{runUuid}/report",
    "admin-api POST /api/v1/admin/time-plans/runs/{runUuid}/repair",
    "admin-api GET /api/v1/admin/uncertainty-models",
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}",
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions",
    "admin-api GET /api/v1/admin/uncertainty-models/{modelUuid}/versions/{versionNumber}",
    "admin-api POST /api/v1/admin/uncertainty-models",
    "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/copy",
    "admin-api POST /api/v1/admin/uncertainty-models/{modelUuid}/versions",
    "admin-api GET /api/v1/app/item/measurements",
    "admin-api GET /api/v1/app/item/runs",
    "analytics-api GET /api/v1/measurement/overview",
    "analytics-api GET /api/v1/measurement/projects/{projectUuid}/forecast-story",
    "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs",
    "analytics-api GET /api/v1/measurement/uncertainty-models/{modelUuid}/runs/{runUuid}",
    "analytics-api POST /api/v1/measurement/uncertainty-models/{modelUuid}/runs",
  ],
};
