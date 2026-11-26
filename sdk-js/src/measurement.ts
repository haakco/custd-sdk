/**
 * Measurement reads and runs served by the analytics API: the tenant overview, prediction
 * definitions with their runs, outcomes and evaluations, project forecasts and forecast stories,
 * decision simulations, and uncertainty model runs. The credential names the tenant.
 */

import type { AppForecastRun, AppForecastRunRequest, AppForecastStory, AppForecastWarning } from "./app-items.js";
import type { AppModelRun, AppModelRunRequest, AppModelRunTrigger } from "./app-models.js";
import type { RequestOptions } from "./index.js";

type APIRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export type MeasurementOverviewPoint = { label: string; value: string };

/** One area of the tenant's measurement overview, shaped for one widget. */
export type MeasurementOverviewArea = {
  key: string;
  title: string;
  headline: string;
  value: string;
  detail: string;
  state: string;
  widgetKind: string;
  provenance?: string;
  points: MeasurementOverviewPoint[];
};

export type MeasurementOverview = {
  generatedAt: string;
  tenant: { companySlug: string; label: string };
  areas: MeasurementOverviewArea[];
};

/** One active prediction definition. */
export type PredictionDefinitionRead = {
  uuid: string;
  definitionKey: string;
  displayName: string;
  status: string;
  isPaused: boolean;
  updatedAt: string;
};

export type PredictionDefinitionReadList = { items: PredictionDefinitionRead[] };

/** One run of a prediction definition. */
export type PredictionRunRead = {
  runUuid: string;
  asOf: string;
  horizonEnd: string;
  output: number;
  baseline: number;
  overrideApplied: boolean;
  inputHash: string;
  contributionCount: number;
  generatedAt: string;
};

export type PredictionRunReadList = { items: PredictionRunRead[] };

/** How one run resolved. */
export type PredictionOutcomeRead = {
  runUuid: string;
  resolution: string;
  outcomeKind: string;
  resolvedAt?: string;
  observedValue: number;
  isLateEvidence: boolean;
};

export type PredictionOutcomeReadList = { items: PredictionOutcomeRead[] };

/** The latest scored window of a definition's resolved runs. */
export type PredictionEvaluationRead = {
  windowStartAt: string;
  windowEndAt: string;
  resolvedRunCount: number;
  positiveCount: number;
  negativeCount: number;
  brierScore?: number;
  logLoss?: number;
  sparseBucketCount: number;
};

/** A decision simulation. A zero or absent seed and sample count use the server defaults. */
export type MeasurementSimulationRunRequest = { seed?: number; sampleCount?: number };

/** One variable's value of information, ranked. */
export type MeasurementSimulationVariable = {
  variableUuid: string;
  name: string;
  rank: number;
  evpi: number;
  evppi?: number;
  measurementCost: number;
  worthMeasuring: boolean;
};

export type MeasurementSimulationRun = {
  simulationRunUuid: string;
  projectUuid: string;
  decisionUuid: string;
  status: string;
  method: string;
  generatedAt: string;
  completedAt: string;
  sampleCount: number;
  seed: number;
  variables: MeasurementSimulationVariable[];
  warnings: AppForecastWarning[];
  provenance: Record<string, string>;
};

/** One stored uncertainty model run, without its results. */
export type UncertaintyModelRunSummary = {
  runUuid: string;
  modelUuid: string;
  versionNumber: number;
  trigger: AppModelRunTrigger;
  sourceForecastRunUuid?: string;
  seed: number;
  sampleCount: number;
  createdAt: string;
};

export type UncertaintyModelRunList = { runs: UncertaintyModelRunSummary[] };

export class MeasurementClient {
  readonly predictions: MeasurementPredictionReads;
  readonly projects: MeasurementProjectRuns;
  readonly uncertaintyModels: MeasurementUncertaintyModelRuns;

  constructor(private readonly request: APIRequester) {
    this.predictions = new MeasurementPredictionReads(request);
    this.projects = new MeasurementProjectRuns(request);
    this.uncertaintyModels = new MeasurementUncertaintyModelRuns(request);
  }

  async overview(): Promise<MeasurementOverview> {
    const wire = await this.request<
      Omit<MeasurementOverview, "areas"> & {
        areas: (Omit<MeasurementOverviewArea, "points"> & { points?: MeasurementOverviewPoint[] | null })[] | null;
      }
    >("GET", "/measurement/overview");
    return { ...wire, areas: (wire.areas ?? []).map((area) => ({ ...area, points: area.points ?? [] })) };
  }
}

/** The tenant's prediction definitions as the analytics API serves them; changes go through admin. */
export class MeasurementPredictionReads {
  constructor(private readonly request: APIRequester) {}

  async listDefinitions(): Promise<PredictionDefinitionReadList> {
    return items(await this.request("GET", definitionPath()));
  }

  getDefinition(definitionUuid: string): Promise<PredictionDefinitionRead> {
    return this.request("GET", definitionPath(definitionUuid));
  }

  /** A definition's runs, newest first; `since` (RFC 3339) keeps only runs as of that time or later. */
  async listRuns(definitionUuid: string, since?: string): Promise<PredictionRunReadList> {
    const query = since ? `?since=${encodeURIComponent(since)}` : "";
    return items(await this.request("GET", `${definitionPath(definitionUuid, "/runs")}${query}`));
  }

  async listOutcomes(definitionUuid: string): Promise<PredictionOutcomeReadList> {
    return items(await this.request("GET", definitionPath(definitionUuid, "/outcomes")));
  }

  getLatestEvaluation(definitionUuid: string): Promise<PredictionEvaluationRead> {
    return this.request("GET", definitionPath(definitionUuid, "/evaluations"));
  }
}

/** A measurement project's forecasts, forecast story and decision simulations. */
export class MeasurementProjectRuns {
  constructor(private readonly request: APIRequester) {}

  runForecast(projectUuid: string, body: AppForecastRunRequest = {}): Promise<AppForecastRun> {
    return this.request("POST", projectPath(projectUuid, "/forecast-runs"), body);
  }

  getForecastRun(projectUuid: string, runUuid: string): Promise<AppForecastRun> {
    return this.request("GET", projectPath(projectUuid, `/forecast-runs/${encodeURIComponent(runUuid)}`));
  }

  async getForecastStory(projectUuid: string): Promise<AppForecastStory> {
    const story = await this.request<AppForecastStory>("GET", projectPath(projectUuid, "/forecast-story"));
    return {
      ...story,
      observations: story.observations ?? [],
      snapshots: story.snapshots ?? [],
      delivery: { ...story.delivery, estimates: story.delivery?.estimates ?? [] },
    };
  }

  async runDecisionSimulation(
    projectUuid: string,
    decisionUuid: string,
    body: MeasurementSimulationRunRequest = {},
  ): Promise<MeasurementSimulationRun> {
    const path = projectPath(projectUuid, `/decisions/${encodeURIComponent(decisionUuid)}/simulation-runs`);
    return simulationRun(await this.request("POST", path, body));
  }

  async getDecisionSimulationRun(
    projectUuid: string,
    decisionUuid: string,
    runUuid: string,
  ): Promise<MeasurementSimulationRun> {
    const resource = `/decisions/${encodeURIComponent(decisionUuid)}/simulation-runs/${encodeURIComponent(runUuid)}`;
    return simulationRun(await this.request("GET", projectPath(projectUuid, resource)));
  }
}

/** Runs of an uncertainty model; the model itself is managed through admin. */
export class MeasurementUncertaintyModelRuns {
  constructor(private readonly request: APIRequester) {}

  async createRun(modelUuid: string, body: AppModelRunRequest): Promise<AppModelRun> {
    return modelRun(await this.request("POST", runsPath(modelUuid), body));
  }

  async listRuns(modelUuid: string): Promise<UncertaintyModelRunList> {
    const list = await this.request<{ runs: UncertaintyModelRunSummary[] | null }>("GET", runsPath(modelUuid));
    return { runs: list.runs ?? [] };
  }

  async getRun(modelUuid: string, runUuid: string): Promise<AppModelRun> {
    return modelRun(await this.request("GET", `${runsPath(modelUuid)}/${encodeURIComponent(runUuid)}`));
  }
}

function items<T>(wire: { items: T[] | null }): { items: T[] } {
  return { items: wire.items ?? [] };
}

function simulationRun(
  wire: Omit<MeasurementSimulationRun, "variables" | "warnings"> & {
    variables: MeasurementSimulationVariable[] | null;
    warnings?: AppForecastWarning[] | null;
  },
): MeasurementSimulationRun {
  return { ...wire, variables: wire.variables ?? [], warnings: wire.warnings ?? [] };
}

function modelRun(wire: AppModelRun): AppModelRun {
  return { ...wire, quantities: wire.quantities ?? [], boundInputs: wire.boundInputs ?? [] };
}

function definitionPath(definitionUuid?: string, resource = ""): string {
  const base = "/measurement/predictions/definitions";
  return definitionUuid === undefined ? base : `${base}/${encodeURIComponent(definitionUuid)}${resource}`;
}

function projectPath(projectUuid: string, resource: string): string {
  return `/measurement/projects/${encodeURIComponent(projectUuid)}${resource}`;
}

function runsPath(modelUuid: string): string {
  return `/measurement/uncertainty-models/${encodeURIComponent(modelUuid)}/runs`;
}
