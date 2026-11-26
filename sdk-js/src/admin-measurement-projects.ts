/**
 * Admin measurement projects: create, read, configure and close a project, and feed it
 * observations, series, targets, runs, estimates, calibration exercises and decision models.
 */

import type {
  AppEstimateCreateRequest,
  AppForecastMethod,
  AppProjectEstimate,
  AppProjectEstimateList,
  AppRunCreateRequest,
} from "./app-items.js";
import type {
  MeasurementCSVImportResponse,
  MeasurementObservationBulkRequest,
  MeasurementObservationBulkResponse,
  MeasurementObservationInput,
  MeasurementObservationResult,
  MeasurementProject,
  MeasurementProjectCreate,
  MeasurementProjectListResponse,
  MeasurementSeries,
  MeasurementSeriesCreate,
  MeasurementTarget,
  MeasurementTargetCreate,
  RequestOptions,
} from "./index.js";

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

export type MeasurementProjectComplete = { completedAt: string };

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

export type MeasurementDecisionModelList = { decisions: MeasurementDecisionModel[] };

export class AdminMeasurementNamespace {
  readonly projects: AdminMeasurementProjectNamespace;

  constructor(request: AdminRequester) {
    this.projects = new AdminMeasurementProjectNamespace(request);
  }
}

export class AdminMeasurementProjectNamespace {
  constructor(private readonly request: AdminRequester) {}

  async create(project: MeasurementProjectCreate, companySlug?: string): Promise<MeasurementProject> {
    return readProject(await this.request<MeasurementProject>("POST", projectPath("", companySlug), project));
  }

  async list(companySlug?: string): Promise<MeasurementProjectListResponse> {
    const response = await this.request<MeasurementProjectListResponse>("GET", projectPath("", companySlug));
    return { projects: (response.projects ?? []).map(readProject) };
  }

  async get(projectUuid: string, companySlug?: string): Promise<MeasurementProject> {
    return readProject(
      await this.request<MeasurementProject>("GET", projectPath(`/${encodeURIComponent(projectUuid)}`, companySlug)),
    );
  }

  async update(projectUuid: string, body: MeasurementProjectUpdate, companySlug?: string): Promise<MeasurementProject> {
    return readProject(
      await this.request<MeasurementProject>(
        "PATCH",
        projectPath(`/${encodeURIComponent(projectUuid)}`, companySlug),
        body,
      ),
    );
  }

  async complete(
    projectUuid: string,
    body: MeasurementProjectComplete,
    companySlug?: string,
  ): Promise<MeasurementProject> {
    return readProject(
      await this.request<MeasurementProject>(
        "POST",
        projectPath(`/${encodeURIComponent(projectUuid)}/complete`, companySlug),
        body,
      ),
    );
  }

  async cancel(projectUuid: string, companySlug?: string): Promise<MeasurementProject> {
    return readProject(
      await this.request<MeasurementProject>(
        "POST",
        projectPath(`/${encodeURIComponent(projectUuid)}/cancel`, companySlug),
      ),
    );
  }

  /** Starts a new run of the project: a sibling project that shares its series. */
  async addRun(projectUuid: string, body: AppRunCreateRequest, companySlug?: string): Promise<MeasurementProject> {
    return readProject(
      await this.request<MeasurementProject>(
        "POST",
        projectPath(`/${encodeURIComponent(projectUuid)}/runs`, companySlug),
        body,
      ),
    );
  }

  addSeries(projectUuid: string, body: MeasurementSeriesCreate, companySlug?: string): Promise<MeasurementSeries> {
    return this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/series`, companySlug), body);
  }

  addTarget(projectUuid: string, body: MeasurementTargetCreate, companySlug?: string): Promise<MeasurementTarget> {
    return this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/targets`, companySlug), body);
  }

  reopenTarget(projectUuid: string, targetUuid: string, companySlug?: string): Promise<MeasurementTarget> {
    const path = `/${encodeURIComponent(projectUuid)}/targets/${encodeURIComponent(targetUuid)}/reopen`;
    return this.request("POST", projectPath(path, companySlug));
  }

  addEstimate(projectUuid: string, body: AppEstimateCreateRequest, companySlug?: string): Promise<AppProjectEstimate> {
    return this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/estimates`, companySlug), body);
  }

  async listEstimates(projectUuid: string, companySlug?: string): Promise<AppProjectEstimateList> {
    const list = await this.request<AppProjectEstimateList>(
      "GET",
      projectPath(`/${encodeURIComponent(projectUuid)}/estimates`, companySlug),
    );
    return { ...list, estimates: list.estimates ?? [] };
  }

  async getImportRun(projectUuid: string, importUuid: string, companySlug?: string): Promise<MeasurementImportRun> {
    const path = `/${encodeURIComponent(projectUuid)}/imports/${encodeURIComponent(importUuid)}`;
    const run = await this.request<MeasurementImportRun>("GET", projectPath(path, companySlug));
    return { ...run, results: run.results ?? [] };
  }

  createCalibrationExercise(
    projectUuid: string,
    body: MeasurementCalibrationExerciseCreate,
    companySlug?: string,
  ): Promise<MeasurementCalibrationExercise> {
    const path = `/${encodeURIComponent(projectUuid)}/calibration-exercises`;
    return this.request("POST", projectPath(path, companySlug), body);
  }

  async createDecisionModel(
    projectUuid: string,
    body: MeasurementDecisionModelCreate,
    companySlug?: string,
  ): Promise<MeasurementDecisionModel> {
    const path = `/${encodeURIComponent(projectUuid)}/decisions`;
    return decisionModel(await this.request("POST", projectPath(path, companySlug), body));
  }

  async listDecisions(projectUuid: string, companySlug?: string): Promise<MeasurementDecisionModelList> {
    const path = `/${encodeURIComponent(projectUuid)}/decisions`;
    const list = await this.request<{ decisions: WireDecisionModel[] | null }>("GET", projectPath(path, companySlug));
    return { decisions: (list.decisions ?? []).map(decisionModel) };
  }

  async getDecision(
    projectUuid: string,
    decisionUuid: string,
    companySlug?: string,
  ): Promise<MeasurementDecisionModel> {
    return decisionModel(await this.request("GET", projectPath(decisionPath(projectUuid, decisionUuid), companySlug)));
  }

  async updateDecision(
    projectUuid: string,
    decisionUuid: string,
    body: MeasurementDecisionModelUpdate,
    companySlug?: string,
  ): Promise<MeasurementDecisionModel> {
    const path = projectPath(decisionPath(projectUuid, decisionUuid), companySlug);
    return decisionModel(await this.request("PATCH", path, body));
  }

  /** Archives the decision model; its simulation runs stay readable. */
  async deleteDecision(projectUuid: string, decisionUuid: string, companySlug?: string): Promise<void> {
    await this.request("DELETE", projectPath(decisionPath(projectUuid, decisionUuid), companySlug));
  }

  submitObservation(
    projectUuid: string,
    observation: MeasurementObservationInput,
  ): Promise<MeasurementObservationBulkResponse> {
    return this.submitObservations(projectUuid, { rows: [observation] });
  }

  async submitObservations(
    projectUuid: string,
    request: MeasurementObservationBulkRequest,
  ): Promise<MeasurementObservationBulkResponse> {
    const response = await this.request<MeasurementObservationBulkResponse>(
      "POST",
      `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:bulk`,
      request,
    );
    validateMeasurementResults(response.results, request.rows.length);
    return response;
  }

  async importCSVString(projectUuid: string, csv: string, expectedRows: number): Promise<MeasurementCSVImportResponse> {
    const response = await this.request<MeasurementCSVImportResponse>(
      "POST",
      `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:csv`,
      { csv },
    );
    validateMeasurementResults(response.results, expectedRows);
    return response;
  }
}

type WireDecisionModel = Omit<MeasurementDecisionModel, "variables" | "choices"> & {
  variables?: MeasurementDecisionVariable[] | null;
  choices?: MeasurementDecisionChoice[] | null;
};

function decisionModel(wire: WireDecisionModel): MeasurementDecisionModel {
  return { ...wire, variables: wire.variables ?? [], choices: wire.choices ?? [] };
}

function decisionPath(projectUuid: string, decisionUuid: string): string {
  return `/${encodeURIComponent(projectUuid)}/decisions/${encodeURIComponent(decisionUuid)}`;
}

/** A project's series list is null when it has none; the SDK returns it as empty. */
function readProject(project: MeasurementProject): MeasurementProject {
  return { ...project, series: project.series ?? [] };
}

function projectPath(path: string, companySlug?: string): string {
  const query = companySlug ? `?companySlug=${encodeURIComponent(companySlug)}` : "";
  return `/measurement/projects${path}${query}`;
}

function validateMeasurementResults(results: MeasurementObservationResult[], submittedRows: number): void {
  if (results.length !== submittedRows) {
    throw new Error(
      `custd: measurement result count ${results.length} does not match submitted row count ${submittedRows}`,
    );
  }
  results.forEach((result, index) => {
    if (result.success && !result.observationUuid) {
      throw new Error(`custd: measurement result ${index} missing observationUuid`);
    }
  });
}
