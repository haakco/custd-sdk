// ParserClient owns the tenant parser routes served by the schema registry:
// the built-in preset catalog, tenant-owned parser CRUD, and the bounded
// dry-run preview. Every method returns a named DTO, never a bare array.
//
// The routes are authenticated by the caller's tenant credential, so no tenant
// slug is ever supplied. Create/update/delete require the tenant
// schema-management authority; list/presets/preview require authentication.
const PARSER_FRAMING_TYPES = ["none", "docker-json", "k8s-cri", "php-multiline"];
/** Parser framing bounds. A caller may request a lower cap; these are hard limits. */
export const DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES = 64 << 10;
export const DEFAULT_PARSER_FRAMING_MAX_LINES = 32;
export const MAX_PARSER_FRAMING_RECORD_BYTES = 1 << 20;
export const MAX_PARSER_FRAMING_LINES = 256;
export class ParserClient {
    constructor(request) {
        this.request = request;
    }
    /** List the built-in reusable parser catalog. */
    listPresets(options) {
        return this.request("GET", "/parsers/presets", undefined, options);
    }
    /** List this tenant's own parsers, wrapped in the named ParserListResponse. */
    async list(options) {
        const value = await this.request("GET", "/parsers", undefined, options);
        if (!Array.isArray(value)) {
            throw new TypeError("custd: parser list response must be a JSON array");
        }
        return { parsers: value };
    }
    /** Create a tenant-owned parser. */
    async create(request, options) {
        const body = parserSaveBody(request);
        return this.request("POST", "/parsers", body, options);
    }
    /** Replace a tenant-owned parser addressed by its explicit UUID. */
    async update(uuid, request, options) {
        const body = parserSaveBody(request);
        return this.request("PUT", `/parsers/${encodeURIComponent(uuid)}`, body, options);
    }
    /** Delete a tenant-owned parser addressed by its explicit UUID. */
    delete(uuid, options) {
        return this.request("DELETE", `/parsers/${encodeURIComponent(uuid)}`, undefined, options);
    }
    /** Run a parser definition against a bounded sample. Writes and retains nothing. */
    async preview(request, options) {
        const body = parserPreviewBody(request);
        return this.request("POST", "/parser-preview", body, options);
    }
}
// parserSaveBody rebuilds the body from the documented fields. An unset
// `enabled` is omitted rather than sent as undefined/null, and extra caller
// properties are kept off the wire by construction.
function parserSaveBody(request) {
    const body = {
        code: request.code,
        name: request.name,
        parserType: request.parserType,
        pattern: request.pattern,
        timestampFormat: request.timestampFormat,
        fieldMapping: request.fieldMapping,
    };
    if (request.framing !== undefined) {
        body.framing = framingBody(request.framing);
    }
    if (request.enabled !== undefined) {
        body.enabled = request.enabled;
    }
    return body;
}
// parserPreviewBody projects the previewed definition onto exactly the fields
// the strictly-decoded preview route accepts. `framing` is carried because
// preview and save share one configuration; the create/update-only `enabled`
// cannot reach it.
function parserPreviewBody(request) {
    const definition = request.parser;
    const parser = {
        code: definition.code,
        name: definition.name,
        parserType: definition.parserType,
        pattern: definition.pattern,
        timestampFormat: definition.timestampFormat,
        fieldMapping: definition.fieldMapping,
    };
    if (definition.framing !== undefined) {
        parser.framing = framingBody(definition.framing);
    }
    return {
        parser,
        sample: request.sample,
        maxLines: request.maxLines,
    };
}
// framingBody validates the framing type and rebuilds only the documented keys,
// so an unknown type never costs a round trip and an extra caller property never
// reaches the wire.
function framingBody(framing) {
    if (!PARSER_FRAMING_TYPES.includes(framing.type)) {
        throw new RangeError(`custd: parser framing type must be one of ${PARSER_FRAMING_TYPES.join(", ")}`);
    }
    if (framing.maxRecordBytes !== undefined &&
        (framing.maxRecordBytes < 0 || framing.maxRecordBytes > MAX_PARSER_FRAMING_RECORD_BYTES)) {
        throw new RangeError(`custd: parser framing maxRecordBytes must be 0..${MAX_PARSER_FRAMING_RECORD_BYTES}`);
    }
    if (framing.maxLines !== undefined && (framing.maxLines < 0 || framing.maxLines > MAX_PARSER_FRAMING_LINES)) {
        throw new RangeError(`custd: parser framing maxLines must be 0..${MAX_PARSER_FRAMING_LINES}`);
    }
    const body = { type: framing.type };
    if (framing.maxRecordBytes !== undefined) {
        body.maxRecordBytes = framing.maxRecordBytes;
    }
    if (framing.maxLines !== undefined) {
        body.maxLines = framing.maxLines;
    }
    return body;
}
