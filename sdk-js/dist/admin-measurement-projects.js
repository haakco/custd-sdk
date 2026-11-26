/**
 * Admin measurement projects: create, read, configure and close a project, and feed it
 * observations, series, targets, runs, estimates, calibration exercises and decision models.
 */
export class AdminMeasurementNamespace {
    constructor(request) {
        this.projects = new AdminMeasurementProjectNamespace(request);
    }
}
export class AdminMeasurementProjectNamespace {
    constructor(request) {
        this.request = request;
    }
    async create(project, companySlug) {
        return readProject(await this.request("POST", projectPath("", companySlug), project));
    }
    async list(companySlug) {
        const response = await this.request("GET", projectPath("", companySlug));
        return { projects: (response.projects ?? []).map(readProject) };
    }
    async get(projectUuid, companySlug) {
        return readProject(await this.request("GET", projectPath(`/${encodeURIComponent(projectUuid)}`, companySlug)));
    }
    async update(projectUuid, body, companySlug) {
        return readProject(await this.request("PATCH", projectPath(`/${encodeURIComponent(projectUuid)}`, companySlug), body));
    }
    async complete(projectUuid, body, companySlug) {
        return readProject(await this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/complete`, companySlug), body));
    }
    async cancel(projectUuid, companySlug) {
        return readProject(await this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/cancel`, companySlug)));
    }
    /** Starts a new run of the project: a sibling project that shares its series. */
    async addRun(projectUuid, body, companySlug) {
        return readProject(await this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/runs`, companySlug), body));
    }
    addSeries(projectUuid, body, companySlug) {
        return this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/series`, companySlug), body);
    }
    addTarget(projectUuid, body, companySlug) {
        return this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/targets`, companySlug), body);
    }
    reopenTarget(projectUuid, targetUuid, companySlug) {
        const path = `/${encodeURIComponent(projectUuid)}/targets/${encodeURIComponent(targetUuid)}/reopen`;
        return this.request("POST", projectPath(path, companySlug));
    }
    addEstimate(projectUuid, body, companySlug) {
        return this.request("POST", projectPath(`/${encodeURIComponent(projectUuid)}/estimates`, companySlug), body);
    }
    async listEstimates(projectUuid, companySlug) {
        const list = await this.request("GET", projectPath(`/${encodeURIComponent(projectUuid)}/estimates`, companySlug));
        return { ...list, estimates: list.estimates ?? [] };
    }
    async getImportRun(projectUuid, importUuid, companySlug) {
        const path = `/${encodeURIComponent(projectUuid)}/imports/${encodeURIComponent(importUuid)}`;
        const run = await this.request("GET", projectPath(path, companySlug));
        return { ...run, results: run.results ?? [] };
    }
    createCalibrationExercise(projectUuid, body, companySlug) {
        const path = `/${encodeURIComponent(projectUuid)}/calibration-exercises`;
        return this.request("POST", projectPath(path, companySlug), body);
    }
    async createDecisionModel(projectUuid, body, companySlug) {
        const path = `/${encodeURIComponent(projectUuid)}/decisions`;
        return decisionModel(await this.request("POST", projectPath(path, companySlug), body));
    }
    async listDecisions(projectUuid, companySlug) {
        const path = `/${encodeURIComponent(projectUuid)}/decisions`;
        const list = await this.request("GET", projectPath(path, companySlug));
        return { decisions: (list.decisions ?? []).map(decisionModel) };
    }
    async getDecision(projectUuid, decisionUuid, companySlug) {
        return decisionModel(await this.request("GET", projectPath(decisionPath(projectUuid, decisionUuid), companySlug)));
    }
    async updateDecision(projectUuid, decisionUuid, body, companySlug) {
        const path = projectPath(decisionPath(projectUuid, decisionUuid), companySlug);
        return decisionModel(await this.request("PATCH", path, body));
    }
    /** Archives the decision model; its simulation runs stay readable. */
    async deleteDecision(projectUuid, decisionUuid, companySlug) {
        await this.request("DELETE", projectPath(decisionPath(projectUuid, decisionUuid), companySlug));
    }
    submitObservation(projectUuid, observation) {
        return this.submitObservations(projectUuid, { rows: [observation] });
    }
    async submitObservations(projectUuid, request) {
        const response = await this.request("POST", `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:bulk`, request);
        validateMeasurementResults(response.results, request.rows.length);
        return response;
    }
    async importCSVString(projectUuid, csv, expectedRows) {
        const response = await this.request("POST", `/measurement/projects/${encodeURIComponent(projectUuid)}/observations:csv`, { csv });
        validateMeasurementResults(response.results, expectedRows);
        return response;
    }
}
function decisionModel(wire) {
    return { ...wire, variables: wire.variables ?? [], choices: wire.choices ?? [] };
}
function decisionPath(projectUuid, decisionUuid) {
    return `/${encodeURIComponent(projectUuid)}/decisions/${encodeURIComponent(decisionUuid)}`;
}
/** A project's series list is null when it has none; the SDK returns it as empty. */
function readProject(project) {
    return { ...project, series: project.series ?? [] };
}
function projectPath(path, companySlug) {
    const query = companySlug ? `?companySlug=${encodeURIComponent(companySlug)}` : "";
    return `/measurement/projects${path}${query}`;
}
function validateMeasurementResults(results, submittedRows) {
    if (results.length !== submittedRows) {
        throw new Error(`custd: measurement result count ${results.length} does not match submitted row count ${submittedRows}`);
    }
    results.forEach((result, index) => {
        if (result.success && !result.observationUuid) {
            throw new Error(`custd: measurement result ${index} missing observationUuid`);
        }
    });
}
