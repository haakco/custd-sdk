/**
 * Admin measurement projects: create, read, configure and close a project, and feed it
 * observations, series, targets, runs, estimates, calibration exercises and decision models.
 */
import type { AppEstimateCreateRequest, AppForecastMethod, AppProjectEstimate, AppProjectEstimateList, AppRunCreateRequest } from "./app-items.js";
import type { MeasurementCSVImportResponse, MeasurementObservationBulkRequest, MeasurementObservationBulkResponse, MeasurementObservationInput, MeasurementObservationResult, MeasurementProject, MeasurementProjectCreate, MeasurementProjectListResponse, MeasurementSeries, MeasurementSeriesCreate, MeasurementTarget, MeasurementTargetCreate, RequestOptions } from "./index.js";
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
/** Changes to a project's name, status, delivery or forecast settings; absent fields are kept. */
export type MeasurementProjectUpdate = {
    name?: string;
    description?: string;
    status?: string;
    definitionOfDone?: string;
    deliveryTargetDate?: string;
    forecastMethod?: AppForecastMethod;
    runSimilar?: boolean;
};
export type MeasurementProjectComplete = {
    completedAt: string;
};
/** One stored import of observations, with each row's outcome. */
export type MeasurementImportRun = {
    importId: string;
    projectCode: string;
    source: string;
    rowCount: number;
    accepted: number;
    rejected: number;
    results: MeasurementObservationResult[];
    createdAt: string;
    completedAt?: string;
};
export type MeasurementCalibrationExerciseCreate = {
    question: string;
    confidence: number;
    lowerBound: number;
    upperBound: number;
    actualValue?: number;
    contained?: boolean;
    resolvedAt?: string;
    priorUuid?: string;
    metadata?: Record<string, unknown>;
};
export type MeasurementCalibrationExercise = {
    exerciseUuid: string;
    projectCode: string;
    question: string;
    confidence: number;
    lowerBound: number;
    upperBound: number;
    actualValue?: number;
    contained?: boolean;
    resolvedAt?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
};
/** A choice's value expression: a constant, a variable reference, or an operator over children. */
export type MeasurementDecisionExpression = {
    kind: string;
    value?: number;
    variableCode?: string;
    children?: MeasurementDecisionExpression[] | null;
};
export type MeasurementDecisionDistributionParameters = {
    value?: number;
    min?: number;
    max?: number;
    mode?: number;
    mean?: number;
    "std-dev"?: number;
};
export type MeasurementDecisionVariableCreate = {
    variableCode: string;
    name: string;
    distributionSlug: string;
    parameters?: MeasurementDecisionDistributionParameters;
    unitSlug?: string;
    measurementCost?: number;
};
export type MeasurementDecisionVariable = {
    variableUuid: string;
    variableCode: string;
    name: string;
    distributionSlug: string;
    parameters?: MeasurementDecisionDistributionParameters;
    unitSlug: string;
    measurementCost: number;
};
export type MeasurementDecisionChoiceCreate = {
    choiceCode: string;
    name: string;
    description?: string;
    expression: MeasurementDecisionExpression;
};
export type MeasurementDecisionChoice = {
    choiceUuid: string;
    choiceCode: string;
    name: string;
    description: string;
    expression?: MeasurementDecisionExpression;
};
export type MeasurementDecisionModelCreate = {
    decisionCode: string;
    name: string;
    description?: string;
    objective?: string;
    status: string;
    variables: MeasurementDecisionVariableCreate[];
    choices: MeasurementDecisionChoiceCreate[];
};
export type MeasurementDecisionModelUpdate = {
    name?: string;
    description?: string;
    objective?: string;
    status?: string;
};
export type MeasurementDecisionModel = {
    decisionUuid: string;
    decisionCode: string;
    projectCode: string;
    name: string;
    description: string;
    objective: string;
    status: string;
    variables: MeasurementDecisionVariable[];
    choices: MeasurementDecisionChoice[];
    createdAt: string;
    updatedAt: string;
};
export type MeasurementDecisionModelList = {
    decisions: MeasurementDecisionModel[];
};
export declare class AdminMeasurementNamespace {
    readonly projects: AdminMeasurementProjectNamespace;
    constructor(request: AdminRequester);
}
export declare class AdminMeasurementProjectNamespace {
    private readonly request;
    constructor(request: AdminRequester);
    create(project: MeasurementProjectCreate, companySlug?: string): Promise<MeasurementProject>;
    list(companySlug?: string): Promise<MeasurementProjectListResponse>;
    get(projectUuid: string, companySlug?: string): Promise<MeasurementProject>;
    update(projectUuid: string, body: MeasurementProjectUpdate, companySlug?: string): Promise<MeasurementProject>;
    complete(projectUuid: string, body: MeasurementProjectComplete, companySlug?: string): Promise<MeasurementProject>;
    cancel(projectUuid: string, companySlug?: string): Promise<MeasurementProject>;
    /** Starts a new run of the project: a sibling project that shares its series. */
    addRun(projectUuid: string, body: AppRunCreateRequest, companySlug?: string): Promise<MeasurementProject>;
    addSeries(projectUuid: string, body: MeasurementSeriesCreate, companySlug?: string): Promise<MeasurementSeries>;
    addTarget(projectUuid: string, body: MeasurementTargetCreate, companySlug?: string): Promise<MeasurementTarget>;
    reopenTarget(projectUuid: string, targetUuid: string, companySlug?: string): Promise<MeasurementTarget>;
    addEstimate(projectUuid: string, body: AppEstimateCreateRequest, companySlug?: string): Promise<AppProjectEstimate>;
    listEstimates(projectUuid: string, companySlug?: string): Promise<AppProjectEstimateList>;
    getImportRun(projectUuid: string, importUuid: string, companySlug?: string): Promise<MeasurementImportRun>;
    createCalibrationExercise(projectUuid: string, body: MeasurementCalibrationExerciseCreate, companySlug?: string): Promise<MeasurementCalibrationExercise>;
    createDecisionModel(projectUuid: string, body: MeasurementDecisionModelCreate, companySlug?: string): Promise<MeasurementDecisionModel>;
    listDecisions(projectUuid: string, companySlug?: string): Promise<MeasurementDecisionModelList>;
    getDecision(projectUuid: string, decisionUuid: string, companySlug?: string): Promise<MeasurementDecisionModel>;
    updateDecision(projectUuid: string, decisionUuid: string, body: MeasurementDecisionModelUpdate, companySlug?: string): Promise<MeasurementDecisionModel>;
    /** Archives the decision model; its simulation runs stay readable. */
    deleteDecision(projectUuid: string, decisionUuid: string, companySlug?: string): Promise<void>;
    submitObservation(projectUuid: string, observation: MeasurementObservationInput): Promise<MeasurementObservationBulkResponse>;
    submitObservations(projectUuid: string, request: MeasurementObservationBulkRequest): Promise<MeasurementObservationBulkResponse>;
    importCSVString(projectUuid: string, csv: string, expectedRows: number): Promise<MeasurementCSVImportResponse>;
}
export {};
