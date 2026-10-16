import type { RequestOptions } from "./index.js";
/** A parser family the ingestion dispatcher can execute. */
export type ParserType = "regex" | "json" | "xml" | "csv" | "syslog";
/** A stateless batch-framing mode applied before the application parser runs. */
export type ParserFramingType = "none" | "docker-json" | "k8s-cri" | "php-multiline";
/** Parser framing bounds. A caller may request a lower cap; these are hard limits. */
export declare const DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES: number;
export declare const DEFAULT_PARSER_FRAMING_MAX_LINES = 32;
export declare const MAX_PARSER_FRAMING_RECORD_BYTES: number;
export declare const MAX_PARSER_FRAMING_LINES = 256;
/** The visible per-record result of one framing pass. */
export type ParserFramingOutcome = "complete" | "malformed" | "incomplete" | "oversize";
/**
 * Stateless framing configuration carried by a parser definition. Framing is
 * revision-pinned with the parser and is the same configuration for preview and
 * save. Multiline assembly is bounded by `maxRecordBytes`/`maxLines`; there is
 * deliberately no idle timeout on stateless batch framing.
 */
export type ParserFraming = {
    type: ParserFramingType;
    maxRecordBytes?: number;
    maxLines?: number;
};
/** How a generated field is computed from source fields. */
export type ParserGeneratedFieldConfig = {
    fields: string[];
    namespace: string;
};
/** A tenant-owned parser. */
export type ParserDefinition = {
    uuid: string;
    code: string;
    name: string;
    parserType: ParserType;
    pattern: string | null;
    timestampFormat: string;
    fieldMapping: Record<string, string>;
    generatedFields?: Record<string, ParserGeneratedFieldConfig> | null;
    /** Stateless framing configuration, revision-pinned with the parser. */
    framing?: ParserFraming;
    /**
     * Newer server fields. Both are optional so a response from a server that
     * predates them still decodes; when present they carry the server's value.
     */
    enabled?: boolean;
    revision?: number;
};
/**
 * The named parser-collection DTO. The route emits a bare JSON array; the
 * client wraps it so callers never handle an untyped list.
 */
export type ParserListResponse = {
    parsers: ParserDefinition[];
};
/** One built-in reusable parser definition from the published catalog. */
export type ParserPreset = {
    code: string;
    name: string;
    family: string;
    description: string;
    parserType: ParserType;
    pattern: string;
    timestampFormat: string;
    fieldMapping: Record<string, string>;
    sample: string;
    variants: string[];
};
/** The named preset-catalog DTO for GET /parsers/presets. */
export type ParserPresetListResponse = {
    presets: ParserPreset[];
};
/**
 * The create/update body for a tenant-owned parser.
 *
 * `enabled` is optional: leaving it unset omits the field so the server keeps
 * its default (an enabled parser), which also keeps the body valid against a
 * server that does not yet accept the field.
 */
export type ParserSaveRequest = {
    code: string;
    name: string;
    parserType: ParserType;
    pattern: string | null;
    timestampFormat: string;
    fieldMapping: Record<string, string>;
    /** Stateless framing configuration, the same for save and preview. */
    framing?: ParserFraming;
    enabled?: boolean;
};
/**
 * The parser shape a preview executes. It mirrors the saved definition minus
 * the server-assigned uuid and the newer-only enabled/revision fields, because
 * the preview route decodes strictly.
 */
export type ParserPreviewDefinition = {
    code: string;
    name: string;
    parserType: ParserType;
    pattern: string | null;
    timestampFormat: string;
    fieldMapping: Record<string, string>;
    /** The same framing configuration a save would carry. */
    framing?: ParserFraming;
};
/** The dry-run body. The service bounds the sample to 256 KiB and maxLines to 100. */
export type ParserPreviewRequest = {
    parser: ParserPreviewDefinition;
    sample: string;
    maxLines: number;
};
/** One sample line's result. `line` is 1-based in the original sample. */
export type ParserPreviewRow = {
    line: number;
    ok: boolean;
    framing?: ParserFramingOutcome;
    eventTypeSlug?: string;
    timestamp?: string;
    context?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    error?: string;
};
/** The dry-run result. `parsed` and `failed` summarize `results`. */
export type ParserPreviewResponse = {
    results: ParserPreviewRow[];
    parsed: number;
    failed: number;
};
/** The body of a successful parser deletion. */
export type ParserDeleteResponse = {
    deleted: boolean;
};
type ParserRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export declare class ParserClient {
    private readonly request;
    constructor(request: ParserRequester);
    /** List the built-in reusable parser catalog. */
    listPresets(options?: RequestOptions): Promise<ParserPresetListResponse>;
    /** List this tenant's own parsers, wrapped in the named ParserListResponse. */
    list(options?: RequestOptions): Promise<ParserListResponse>;
    /** Create a tenant-owned parser. */
    create(request: ParserSaveRequest, options?: RequestOptions): Promise<ParserDefinition>;
    /** Replace a tenant-owned parser addressed by its explicit UUID. */
    update(uuid: string, request: ParserSaveRequest, options?: RequestOptions): Promise<ParserDefinition>;
    /** Delete a tenant-owned parser addressed by its explicit UUID. */
    delete(uuid: string, options?: RequestOptions): Promise<ParserDeleteResponse>;
    /** Run a parser definition against a bounded sample. Writes and retains nothing. */
    preview(request: ParserPreviewRequest, options?: RequestOptions): Promise<ParserPreviewResponse>;
}
export {};
