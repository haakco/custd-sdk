// ParserClient owns the tenant parser routes served by the schema registry:
// the built-in preset catalog, tenant-owned parser CRUD, and the bounded
// dry-run preview. Every method returns a named DTO, never a bare array.
//
// The routes are authenticated by the caller's tenant credential, so no tenant
// slug is ever supplied. Create/update/delete require the tenant
// schema-management authority; list/presets/preview require authentication.

import type { RequestOptions } from "./index.js";

/** A parser family the ingestion dispatcher can execute. */
export type ParserType = "regex" | "json" | "xml" | "csv" | "syslog";

/** A stateless batch-framing mode applied before the application parser runs. */
export type ParserFramingType = "none" | "docker-json" | "k8s-cri" | "php-multiline";

const PARSER_FRAMING_TYPES: readonly ParserFramingType[] = ["none", "docker-json", "k8s-cri", "php-multiline"];

/** Parser framing bounds. A caller may request a lower cap; these are hard limits. */
export const DEFAULT_PARSER_FRAMING_MAX_RECORD_BYTES = 64 << 10;
export const DEFAULT_PARSER_FRAMING_MAX_LINES = 32;
export const MAX_PARSER_FRAMING_RECORD_BYTES = 1 << 20;
export const MAX_PARSER_FRAMING_LINES = 256;

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

export class ParserClient {
  constructor(private readonly request: ParserRequester) {}

  /** List the built-in reusable parser catalog. */
  listPresets(options?: RequestOptions): Promise<ParserPresetListResponse> {
    return this.request<ParserPresetListResponse>("GET", "/parsers/presets", undefined, options);
  }

  /** List this tenant's own parsers, wrapped in the named ParserListResponse. */
  async list(options?: RequestOptions): Promise<ParserListResponse> {
    const value = await this.request<unknown>("GET", "/parsers", undefined, options);
    if (!Array.isArray(value)) {
      throw new TypeError("custd: parser list response must be a JSON array");
    }
    return { parsers: value as ParserDefinition[] };
  }

  /** Create a tenant-owned parser. */
  async create(request: ParserSaveRequest, options?: RequestOptions): Promise<ParserDefinition> {
    const body = parserSaveBody(request);
    return this.request<ParserDefinition>("POST", "/parsers", body, options);
  }

  /** Replace a tenant-owned parser addressed by its explicit UUID. */
  async update(uuid: string, request: ParserSaveRequest, options?: RequestOptions): Promise<ParserDefinition> {
    const body = parserSaveBody(request);
    return this.request<ParserDefinition>("PUT", `/parsers/${encodeURIComponent(uuid)}`, body, options);
  }

  /** Delete a tenant-owned parser addressed by its explicit UUID. */
  delete(uuid: string, options?: RequestOptions): Promise<ParserDeleteResponse> {
    return this.request<ParserDeleteResponse>("DELETE", `/parsers/${encodeURIComponent(uuid)}`, undefined, options);
  }

  /** Run a parser definition against a bounded sample. Writes and retains nothing. */
  async preview(request: ParserPreviewRequest, options?: RequestOptions): Promise<ParserPreviewResponse> {
    const body = parserPreviewBody(request);
    return this.request<ParserPreviewResponse>("POST", "/parser-preview", body, options);
  }
}

// parserSaveBody rebuilds the body from the documented fields. An unset
// `enabled` is omitted rather than sent as undefined/null, and extra caller
// properties are kept off the wire by construction.
function parserSaveBody(request: ParserSaveRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
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
function parserPreviewBody(request: ParserPreviewRequest): Record<string, unknown> {
  const definition = request.parser;
  const parser: Record<string, unknown> = {
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
function framingBody(framing: ParserFraming): Record<string, unknown> {
  if (!PARSER_FRAMING_TYPES.includes(framing.type)) {
    throw new RangeError(`custd: parser framing type must be one of ${PARSER_FRAMING_TYPES.join(", ")}`);
  }
  if (
    framing.maxRecordBytes !== undefined &&
    (framing.maxRecordBytes < 0 || framing.maxRecordBytes > MAX_PARSER_FRAMING_RECORD_BYTES)
  ) {
    throw new RangeError(`custd: parser framing maxRecordBytes must be 0..${MAX_PARSER_FRAMING_RECORD_BYTES}`);
  }
  if (framing.maxLines !== undefined && (framing.maxLines < 0 || framing.maxLines > MAX_PARSER_FRAMING_LINES)) {
    throw new RangeError(`custd: parser framing maxLines must be 0..${MAX_PARSER_FRAMING_LINES}`);
  }
  const body: Record<string, unknown> = { type: framing.type };
  if (framing.maxRecordBytes !== undefined) {
    body.maxRecordBytes = framing.maxRecordBytes;
  }
  if (framing.maxLines !== undefined) {
    body.maxLines = framing.maxLines;
  }
  return body;
}
