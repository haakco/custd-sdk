/**
 * Measurement reads and runs served by the analytics API: the tenant overview, prediction
 * definitions with their runs, outcomes and evaluations, project forecasts and forecast stories,
 * decision simulations, and uncertainty model runs. The credential names the tenant.
 */
export class MeasurementClient {
    constructor(request) {
        this.request = request;
        this.predictions = new MeasurementPredictionReads(request);
        this.projects = new MeasurementProjectRuns(request);
        this.uncertaintyModels = new MeasurementUncertaintyModelRuns(request);
    }
    async overview() {
        const wire = await this.request("GET", "/measurement/overview");
        return { ...wire, areas: (wire.areas ?? []).map((area) => ({ ...area, points: area.points ?? [] })) };
    }
}
/** The tenant's prediction definitions as the analytics API serves them; changes go through admin. */
export class MeasurementPredictionReads {
    constructor(request) {
        this.request = request;
    }
    async listDefinitions() {
        return items(await this.request("GET", definitionPath()));
    }
    getDefinition(definitionUuid) {
        return this.request("GET", definitionPath(definitionUuid));
    }
    /** A definition's runs, newest first; `since` (RFC 3339) keeps only runs as of that time or later. */
    async listRuns(definitionUuid, since) {
        const query = since ? `?since=${encodeURIComponent(since)}` : "";
        return items(await this.request("GET", `${definitionPath(definitionUuid, "/runs")}${query}`));
    }
    async listOutcomes(definitionUuid) {
        return items(await this.request("GET", definitionPath(definitionUuid, "/outcomes")));
    }
    getLatestEvaluation(definitionUuid) {
        return this.request("GET", definitionPath(definitionUuid, "/evaluations"));
    }
}
/** A measurement project's forecasts, forecast story and decision simulations. */
export class MeasurementProjectRuns {
    constructor(request) {
        this.request = request;
    }
    runForecast(projectUuid, body = {}) {
        return this.request("POST", projectPath(projectUuid, "/forecast-runs"), body);
    }
    getForecastRun(projectUuid, runUuid) {
        return this.request("GET", projectPath(projectUuid, `/forecast-runs/${encodeURIComponent(runUuid)}`));
    }
    async getForecastStory(projectUuid) {
        const story = await this.request("GET", projectPath(projectUuid, "/forecast-story"));
        return {
            ...story,
            observations: story.observations ?? [],
            snapshots: story.snapshots ?? [],
            delivery: { ...story.delivery, estimates: story.delivery?.estimates ?? [] },
        };
    }
    async runDecisionSimulation(projectUuid, decisionUuid, body = {}) {
        const path = projectPath(projectUuid, `/decisions/${encodeURIComponent(decisionUuid)}/simulation-runs`);
        return simulationRun(await this.request("POST", path, body));
    }
    async getDecisionSimulationRun(projectUuid, decisionUuid, runUuid) {
        const resource = `/decisions/${encodeURIComponent(decisionUuid)}/simulation-runs/${encodeURIComponent(runUuid)}`;
        return simulationRun(await this.request("GET", projectPath(projectUuid, resource)));
    }
}
/** Runs of an uncertainty model; the model itself is managed through admin. */
export class MeasurementUncertaintyModelRuns {
    constructor(request) {
        this.request = request;
    }
    async createRun(modelUuid, body) {
        return modelRun(await this.request("POST", runsPath(modelUuid), body));
    }
    async listRuns(modelUuid) {
        const list = await this.request("GET", runsPath(modelUuid));
        return { runs: list.runs ?? [] };
    }
    async getRun(modelUuid, runUuid) {
        return modelRun(await this.request("GET", `${runsPath(modelUuid)}/${encodeURIComponent(runUuid)}`));
    }
}
function items(wire) {
    return { items: wire.items ?? [] };
}
function simulationRun(wire) {
    return { ...wire, variables: wire.variables ?? [], warnings: wire.warnings ?? [] };
}
function modelRun(wire) {
    return { ...wire, quantities: wire.quantities ?? [], boundInputs: wire.boundInputs ?? [] };
}
function definitionPath(definitionUuid, resource = "") {
    const base = "/measurement/predictions/definitions";
    return definitionUuid === undefined ? base : `${base}/${encodeURIComponent(definitionUuid)}${resource}`;
}
function projectPath(projectUuid, resource) {
    return `/measurement/projects/${encodeURIComponent(projectUuid)}${resource}`;
}
function runsPath(modelUuid) {
    return `/measurement/uncertainty-models/${encodeURIComponent(modelUuid)}/runs`;
}
