export class PredictionAdminClient {
    constructor(request) {
        this.request = request;
    }
    listDefinitions(companySlug, pageSize, pageToken, options) {
        return this.request("GET", collectionPath("/definitions", companySlug, pageSize, pageToken), undefined, options);
    }
    getDefinition(companySlug, definitionUuid, options) {
        return this.request("GET", resourcePath(`/definitions/${definitionUuid}`, companySlug), undefined, options);
    }
    createDefinition(companySlug, body, options) {
        return this.request("POST", collectionPath("/definitions", companySlug), body, options);
    }
    updateDefinition(companySlug, definitionUuid, body, options) {
        return this.request("PATCH", resourcePath(`/definitions/${definitionUuid}`, companySlug), body, options);
    }
    getVersion(companySlug, definitionUuid, versionUuid, options) {
        return this.request("GET", resourcePath(`/definitions/${definitionUuid}/versions/${versionUuid}`, companySlug), undefined, options);
    }
    publishVersion(companySlug, definitionUuid, body, options) {
        return this.request("POST", resourcePath(`/definitions/${definitionUuid}/publish`, companySlug), body, options);
    }
    activateVersion(companySlug, definitionUuid, body, options) {
        return this.request("POST", resourcePath(`/definitions/${definitionUuid}/activate`, companySlug), body, options);
    }
    pauseDefinition(companySlug, definitionUuid, body = {}, options) {
        return this.request("POST", resourcePath(`/definitions/${definitionUuid}/pause`, companySlug), body, options);
    }
    resumeDefinition(companySlug, definitionUuid, options) {
        return this.request("POST", resourcePath(`/definitions/${definitionUuid}/resume`, companySlug), undefined, options);
    }
    archiveDefinition(companySlug, definitionUuid, options) {
        return this.request("POST", resourcePath(`/definitions/${definitionUuid}/archive`, companySlug), undefined, options);
    }
    runNow(companySlug, definitionUuid, body = {}, options) {
        return this.request("POST", resourcePath(`/definitions/${definitionUuid}/run-now`, companySlug), body, options);
    }
    async listRuns(companySlug, definitionUuid, pageSize, options) {
        const list = await this.request("GET", collectionPath(`/definitions/${definitionUuid}/runs`, companySlug, pageSize), undefined, options);
        return { runs: list.runs ?? [] };
    }
    async listOutcomes(companySlug, definitionUuid, pageSize, options) {
        const list = await this.request("GET", collectionPath(`/definitions/${definitionUuid}/outcomes`, companySlug, pageSize), undefined, options);
        return { outcomes: list.outcomes ?? [] };
    }
    getEvaluation(companySlug, definitionUuid, options) {
        return this.request("GET", resourcePath(`/definitions/${definitionUuid}/evaluations`, companySlug), undefined, options);
    }
    async evaluateDurationHistory(companySlug, definitionUuid, body, options) {
        const evaluation = await this.request("POST", resourcePath(`/definitions/${definitionUuid}/duration-evaluations`, companySlug), body, options);
        const { versionEvidence, artifact } = evaluation;
        return {
            ...evaluation,
            versionEvidence: { ...versionEvidence, history: { items: versionEvidence.history?.items ?? [] } },
            artifact: { ...artifact, evaluation: { ...artifact.evaluation, folds: artifact.evaluation.folds ?? [] } },
        };
    }
    async listThresholdEvents(companySlug, definitionUuid, pageSize, options) {
        const list = await this.request("GET", collectionPath(`/definitions/${definitionUuid}/threshold-events`, companySlug, pageSize), undefined, options);
        return { events: list.events ?? [] };
    }
    async listSignalSources(companySlug, pageSize, pageToken, options) {
        const list = await this.request("GET", collectionPath("/sources", companySlug, pageSize, pageToken), undefined, options);
        return { ...list, sources: list.sources ?? [] };
    }
    getSignalSource(companySlug, sourceUuid, options) {
        return this.request("GET", resourcePath(`/sources/${sourceUuid}`, companySlug), undefined, options);
    }
    createSignalSource(companySlug, body, options) {
        return this.request("POST", collectionPath("/sources", companySlug), body, options);
    }
    activateSignalSource(companySlug, sourceUuid, options) {
        return this.request("POST", resourcePath(`/sources/${sourceUuid}/activate`, companySlug), undefined, options);
    }
    archiveSignalSource(companySlug, sourceUuid, options) {
        return this.request("POST", resourcePath(`/sources/${sourceUuid}/archive`, companySlug), undefined, options);
    }
}
function collectionPath(path, companySlug, pageSize, pageToken) {
    const query = new URLSearchParams({ companySlug });
    if (pageSize !== undefined)
        query.set("pageSize", String(pageSize));
    if (pageToken !== undefined)
        query.set("pageToken", pageToken);
    return `/measurement/predictions${path}?${query.toString()}`;
}
function resourcePath(path, companySlug) {
    const encodedPath = path
        .split("/")
        .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
        .join("/");
    return collectionPath(encodedPath, companySlug);
}
