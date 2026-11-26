/**
 * Admin uncertainty models: named quantity models, their immutable versions and copies. Runs are
 * read and started through the analytics API (`CustdClient.measurement.uncertaintyModels`).
 */
export class UncertaintyModelAdminClient {
    constructor(request) {
        this.request = request;
    }
    async list(source, companySlug) {
        const list = await this.request("GET", modelPath("", companySlug, source));
        return { models: list.models ?? [] };
    }
    async get(modelUuid, companySlug) {
        return model(await this.request("GET", modelPath(`/${encodeURIComponent(modelUuid)}`, companySlug)));
    }
    async create(body, companySlug) {
        return model(await this.request("POST", modelPath("", companySlug), body));
    }
    async copy(modelUuid, body = {}, companySlug) {
        return model(await this.request("POST", modelPath(`/${encodeURIComponent(modelUuid)}/copy`, companySlug), body));
    }
    async delete(modelUuid, companySlug) {
        await this.request("DELETE", modelPath(`/${encodeURIComponent(modelUuid)}`, companySlug));
    }
    async listVersions(modelUuid, companySlug) {
        const path = modelPath(`/${encodeURIComponent(modelUuid)}/versions`, companySlug);
        const list = await this.request("GET", path);
        return { versions: list.versions ?? [] };
    }
    async getVersion(modelUuid, versionNumber, companySlug) {
        const path = modelPath(`/${encodeURIComponent(modelUuid)}/versions/${versionNumber}`, companySlug);
        return version(await this.request("GET", path));
    }
    async createVersion(modelUuid, body, companySlug) {
        const path = modelPath(`/${encodeURIComponent(modelUuid)}/versions`, companySlug);
        return version(await this.request("POST", path, body));
    }
}
function version(wire) {
    return { ...wire, quantities: wire.quantities ?? [] };
}
function model(wire) {
    return wire.version ? { ...wire, version: version(wire.version) } : wire;
}
function modelPath(path, companySlug, source) {
    const query = new URLSearchParams();
    if (companySlug)
        query.set("companySlug", companySlug);
    if (source)
        query.set("source", source);
    const encoded = query.toString();
    return `/uncertainty-models${path}${encoded ? `?${encoded}` : ""}`;
}
