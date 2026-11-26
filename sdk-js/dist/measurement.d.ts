/**
 * Measurement reads and runs served by the analytics API: the tenant overview, prediction
 * definitions with their runs, outcomes and evaluations, project forecasts and forecast stories,
 * decision simulations, and uncertainty model runs. The credential names the tenant.
 */
import type { AppForecastRun, AppForecastRunRequest, AppForecastStory, AppForecastWarning } from "./app-items.js";
import type { AppModelRun, AppModelRunRequest, AppModelRunTrigger } from "./app-models.js";
import type { RequestOptions } from "./index.js";
type APIRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export type MeasurementOverviewPoint = {
    label: string;
    value: string;
};
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
    tenant: {
        companySlug: string;
        label: string;
    };
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
export type PredictionDefinitionReadList = {
    items: PredictionDefinitionRead[];
};
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
export type PredictionRunReadList = {
    items: PredictionRunRead[];
};
/** How one run resolved. */
export type PredictionOutcomeRead = {
    runUuid: string;
    resolution: string;
    outcomeKind: string;
    resolvedAt?: string;
    observedValue: number;
    isLateEvidence: boolean;
};
export type PredictionOutcomeReadList = {
    items: PredictionOutcomeRead[];
};
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
export type MeasurementSimulationRunRequest = {
    seed?: number;
    sampleCount?: number;
};
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
export type UncertaintyModelRunList = {
    runs: UncertaintyModelRunSummary[];
};
export declare class MeasurementClient {
    private readonly request;
    readonly predictions: MeasurementPredictionReads;
    readonly projects: MeasurementProjectRuns;
    readonly uncertaintyModels: MeasurementUncertaintyModelRuns;
    constructor(request: APIRequester);
    overview(): Promise<MeasurementOverview>;
}
/** The tenant's prediction definitions as the analytics API serves them; changes go through admin. */
export declare class MeasurementPredictionReads {
    private readonly request;
    constructor(request: APIRequester);
    listDefinitions(): Promise<PredictionDefinitionReadList>;
    getDefinition(definitionUuid: string): Promise<PredictionDefinitionRead>;
    /** A definition's runs, newest first; `since` (RFC 3339) keeps only runs as of that time or later. */
    listRuns(definitionUuid: string, since?: string): Promise<PredictionRunReadList>;
    listOutcomes(definitionUuid: string): Promise<PredictionOutcomeReadList>;
    getLatestEvaluation(definitionUuid: string): Promise<PredictionEvaluationRead>;
}
/** A measurement project's forecasts, forecast story and decision simulations. */
export declare class MeasurementProjectRuns {
    private readonly request;
    constructor(request: APIRequester);
    runForecast(projectUuid: string, body?: AppForecastRunRequest): Promise<AppForecastRun>;
    getForecastRun(projectUuid: string, runUuid: string): Promise<AppForecastRun>;
    getForecastStory(projectUuid: string): Promise<AppForecastStory>;
    runDecisionSimulation(projectUuid: string, decisionUuid: string, body?: MeasurementSimulationRunRequest): Promise<MeasurementSimulationRun>;
    getDecisionSimulationRun(projectUuid: string, decisionUuid: string, runUuid: string): Promise<MeasurementSimulationRun>;
}
/** Runs of an uncertainty model; the model itself is managed through admin. */
export declare class MeasurementUncertaintyModelRuns {
    private readonly request;
    constructor(request: APIRequester);
    createRun(modelUuid: string, body: AppModelRunRequest): Promise<AppModelRun>;
    listRuns(modelUuid: string): Promise<UncertaintyModelRunList>;
    getRun(modelUuid: string, runUuid: string): Promise<AppModelRun>;
}
export {};
