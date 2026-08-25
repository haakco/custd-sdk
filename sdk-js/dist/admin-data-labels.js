const includeDisabledQuery = (include) => (include ? "?includeDisabled=true" : "");
export class DataLabelAdminClient {
    constructor(request) {
        this.request = request;
    }
    list(includeDisabled = false) {
        return this.request("GET", `/data-labels${includeDisabledQuery(includeDisabled)}`);
    }
    catalogue(includeDisabled = false) {
        return this.request("GET", `/data-labels/catalogue${includeDisabledQuery(includeDisabled)}`);
    }
    get(uuid, includeDisabled = false) {
        return this.request("GET", `/data-labels/${encodeURIComponent(uuid)}${includeDisabledQuery(includeDisabled)}`);
    }
    create(body) {
        return this.request("POST", "/data-labels", body);
    }
    update(uuid, body) {
        return this.request("PATCH", `/data-labels/${encodeURIComponent(uuid)}`, body);
    }
    disable(uuid) {
        return this.request("POST", `/data-labels/${encodeURIComponent(uuid)}/disable`);
    }
    createValue(uuid, body) {
        return this.request("POST", `/data-labels/${encodeURIComponent(uuid)}/values`, body);
    }
    updateValue(uuid, body) {
        return this.request("PATCH", `/data-label-values/${encodeURIComponent(uuid)}`, body);
    }
    disableValue(uuid) {
        return this.request("POST", `/data-label-values/${encodeURIComponent(uuid)}/disable`);
    }
    listUsage() {
        return this.request("GET", "/data-labels/usage");
    }
    listAssignments() {
        return this.request("GET", "/data-label-assignments");
    }
    setEventTypeDefault(slug, definitionUuid, body) {
        return this.request("PUT", `/event-types/${encodeURIComponent(slug)}/data-label-defaults/${encodeURIComponent(definitionUuid)}`, body);
    }
    removeEventTypeDefault(slug, definitionUuid) {
        return this.request("DELETE", `/event-types/${encodeURIComponent(slug)}/data-label-defaults/${encodeURIComponent(definitionUuid)}`);
    }
    setSchemaFieldAssignment(schemaUuid, body) {
        return this.request("PUT", `/event-schemas/${encodeURIComponent(schemaUuid)}/field-data-labels`, body);
    }
    removeSchemaFieldAssignment(assignmentUuid) {
        return this.request("DELETE", `/data-label-assignments/schema-fields/${encodeURIComponent(assignmentUuid)}`);
    }
}
