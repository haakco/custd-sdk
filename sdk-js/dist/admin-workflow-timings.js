/**
 * Workflow timings: facts another system observed about its own work. Custd is not the
 * controller: the caller keeps its own lifecycle and reports what it observed after its own
 * commit. Every append is idempotent through the caller's deterministic key, and a 200 answer
 * is not a durable append: read each result's `accepted`.
 */
/** Expectation states. Only `ready` may be presented as a forecast; a cold start must look different. */
export const WORKFLOW_TIMING_STATES = {
    ready: "ready",
    coldStart: "cold_start",
    sparse: "sparse",
    stale: "stale",
    partial: "partial",
    unavailable: "unavailable",
    error: "error",
};
/** The observed fact kinds. */
export const WORKFLOW_TIMING_FACT_KINDS = {
    runStarted: "run_started",
    runFinished: "run_finished",
    stepStarted: "step_started",
    stepFinished: "step_finished",
};
export class WorkflowTimingAdminClient {
    constructor(request) {
        this.request = request;
    }
    /** Declaratively applies one workflow shape, keyed by its workflowKey. */
    reconcileDefinition(companySlug, declaration, options) {
        const path = timingPath(`/definitions/${encodeURIComponent(declaration.workflowKey)}`, companySlug);
        return this.request("PUT", path, declaration, options).then((result) => ({
            ...result,
            definition: definition(result.definition),
        }));
    }
    async listDefinitions(companySlug, limit, options) {
        const path = timingPath("/definitions", companySlug, { limit });
        const list = await this.request("GET", path, undefined, options);
        return { items: (list.items ?? []).map(definition) };
    }
    async getDefinition(companySlug, workflowKey, options) {
        const path = timingPath(`/definitions/${encodeURIComponent(workflowKey)}`, companySlug);
        return definition(await this.request("GET", path, undefined, options));
    }
    /** Records one observed fact. Read the result's `accepted`, not the transport status. */
    appendObservation(companySlug, observation, options) {
        return this.append("/observations", companySlug, { observation }, options);
    }
    /** Records a bounded batch (10,000 facts, 1 MiB). Replay a failed request with the same idempotency keys. */
    appendObservations(companySlug, observations, options) {
        return this.append("/observations:batch", companySlug, { observations }, options);
    }
    /** Appends a fact that supersedes an accepted one; the observation must name `supersedesFactUuid`. */
    correctObservation(companySlug, observation, options) {
        return this.append("/corrections", companySlug, { observation }, options);
    }
    /** Lists observed runs, newest first. The server filters by workflow before it limits. */
    async listRuns(companySlug, query = {}, options) {
        const path = timingPath("/runs", companySlug, { workflowKey: query.workflowKey, limit: query.limit });
        const list = await this.request("GET", path, undefined, options);
        return { items: list.items ?? [] };
    }
    async getRun(companySlug, runUuid, options) {
        const path = timingPath(`/runs/${encodeURIComponent(runUuid)}`, companySlug);
        const run = await this.request("GET", path, undefined, options);
        return { ...run, attempts: run.attempts ?? [] };
    }
    /** Reads the evidence-backed completion expectation for one run. */
    async getPrediction(companySlug, runUuid, options) {
        const path = timingPath(`/runs/${encodeURIComponent(runUuid)}/prediction`, companySlug);
        const prediction = await this.request("GET", path, undefined, options);
        return { ...prediction, run: expectation(prediction.run), steps: (prediction.steps ?? []).map(expectation) };
    }
    async getDurationHistory(companySlug, workflowKey, limit, options) {
        const path = timingPath(`/definitions/${encodeURIComponent(workflowKey)}/duration-history`, companySlug, { limit });
        const history = await this.request("GET", path, undefined, options);
        return { ...history, entries: history.entries ?? [], contributions: history.contributions ?? [] };
    }
    getEvaluation(companySlug, workflowKey, seriesKey, options) {
        const path = timingPath(`/definitions/${encodeURIComponent(workflowKey)}/evaluation`, companySlug, { seriesKey });
        return this.request("GET", path, undefined, options);
    }
    /** Rebuilds one run's projection from its ledger: the repair path when its status reports pending facts. */
    async rebuildRun(companySlug, runUuid, options) {
        const path = timingPath(`/runs/${encodeURIComponent(runUuid)}/rebuild`, companySlug);
        return rebuildResult(await this.request("POST", path, undefined, options));
    }
    async append(route, companySlug, body, options) {
        const result = await this.request("POST", timingPath(route, companySlug), body, options);
        return { ...result, results: result.results ?? [] };
    }
}
function timingPath(route, companySlug, query = {}) {
    const params = new URLSearchParams({ companySlug });
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "")
            params.set(key, String(value));
    }
    return `/workflow-timings${route}?${params.toString()}`;
}
function definition(value) {
    const revision = value.currentRevision;
    return {
        ...value,
        currentRevision: { ...revision, dimensions: revision.dimensions ?? [], steps: revision.steps ?? [] },
    };
}
function expectation(value) {
    return { ...value, warnings: value.warnings ?? [] };
}
function rebuildResult(value) {
    return {
        ...value,
        projection: { ...value.projection, attempts: value.projection.attempts ?? [] },
        durations: { ...value.durations, steps: value.durations.steps ?? [], excluded: value.durations.excluded ?? [] },
    };
}
