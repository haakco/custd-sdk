const setupManifestKeys = new Set(["schemas", "privacy", "retention", "reportingPacks", "oauthClients"]);
const setupPurposeProfiles = [
    "ingest",
    "schema",
    "reporting",
    "lifecycle",
    "broker",
];
const setupRetentionClasses = new Set(["raw", "archive", "materialized", "cache", "object"]);
const setupPrivacyActions = new Set(["keep", "hash", "truncate", "remove", "strip_query", "origin"]);
// Three independent runtime consumers reconcile on a 15-second interval. The
// last acknowledgement can require one further cycle before activation.
const defaultSetupReadinessTimeoutMs = 45000;
const defaultSetupReadinessIntervalMs = 1000;
// validateClientSetupManifest mirrors the manifest's client-visible shape so
// malformed configuration fails before it reaches the Admin API. Server-side
// validation remains authoritative for full reporting-pack semantics.
export function validateClientSetupManifest(manifest) {
    if (!isRecord(manifest)) {
        throw new Error("custd: tenant manifest must be an object");
    }
    for (const key of Object.keys(manifest)) {
        if (!setupManifestKeys.has(key)) {
            throw new Error(`custd: tenant manifest field ${key} is not supported`);
        }
    }
    validateSetupSchemas(manifest.schemas);
    validateSetupPrivacy(manifest.privacy);
    validateSetupRetention(manifest.retention);
    validateSetupReportingPacks(manifest.reportingPacks);
    validateSetupOAuthClients(manifest.oauthClients);
}
function validateSetupSchemas(schemas) {
    if (schemas === undefined)
        return;
    if (!Array.isArray(schemas))
        throw new Error("custd: manifest schemas must be an array");
    const seen = new Set();
    schemas.forEach((value, index) => {
        const schema = setupRecord(value, `schemas[${index}]`);
        const eventTypeSlug = setupString(schema.eventTypeSlug, `schemas[${index}].eventTypeSlug`);
        const version = setupString(schema.version, `schemas[${index}].version`);
        if (!isRecord(schema.schemaJson))
            throw new Error(`custd: schemas[${index}].schemaJson must be an object`);
        if (schema.dialect !== undefined && schema.dialect !== "jsonschema" && schema.dialect !== "avro") {
            throw new Error(`custd: schemas[${index}].dialect is unsupported`);
        }
        if (typeof schema.enabled !== "boolean")
            throw new Error(`custd: schemas[${index}].enabled must be a boolean`);
        const key = `${eventTypeSlug}@${version}`;
        if (seen.has(key))
            throw new Error(`custd: duplicate schema ${key}`);
        seen.add(key);
    });
}
function validateSetupPrivacy(privacy) {
    if (privacy === undefined)
        return;
    const value = setupRecord(privacy, "privacy");
    if (value.applyMode !== undefined && typeof value.applyMode !== "string") {
        throw new Error("custd: privacy.applyMode must be a string");
    }
    if (typeof value.enabled !== "boolean")
        throw new Error("custd: privacy.enabled must be a boolean");
    if (value.rules === undefined)
        return;
    if (!Array.isArray(value.rules))
        throw new Error("custd: privacy.rules must be an array");
    value.rules.forEach((entry, index) => {
        const rule = setupRecord(entry, `privacy.rules[${index}]`);
        setupString(rule.fieldPath, `privacy.rules[${index}].fieldPath`);
        const action = setupString(rule.action, `privacy.rules[${index}].action`);
        if (!setupPrivacyActions.has(action))
            throw new Error(`custd: privacy.rules[${index}].action is unsupported`);
        if (typeof rule.enabled !== "boolean") {
            throw new Error(`custd: privacy.rules[${index}].enabled must be a boolean`);
        }
        if (rule.truncateLength !== undefined && (!isInteger(rule.truncateLength) || rule.truncateLength < 1)) {
            throw new Error(`custd: privacy.rules[${index}].truncateLength must be positive`);
        }
    });
}
function validateSetupRetention(retention) {
    if (retention === undefined)
        return;
    const value = setupRecord(retention, "retention");
    if (!isInteger(value.maxAgeDays) || value.maxAgeDays < 1) {
        throw new Error("custd: retention.maxAgeDays must be positive");
    }
    if (!Array.isArray(value.classes) || value.classes.length === 0) {
        throw new Error("custd: retention.classes must be a non-empty array");
    }
    const seen = new Set();
    value.classes.forEach((entry, index) => {
        const className = setupString(entry, `retention.classes[${index}]`);
        if (!setupRetentionClasses.has(className))
            throw new Error(`custd: retention class ${className} is unsupported`);
        if (seen.has(className))
            throw new Error(`custd: duplicate retention class ${className}`);
        seen.add(className);
    });
}
function validateSetupReportingPacks(packs) {
    if (packs === undefined)
        return;
    if (!Array.isArray(packs))
        throw new Error("custd: manifest reportingPacks must be an array");
    const seen = new Set();
    packs.forEach((entry, index) => {
        const desired = setupRecord(entry, `reportingPacks[${index}]`);
        const definition = setupRecord(desired.definition, `reportingPacks[${index}].definition`);
        const definitionField = `reportingPacks[${index}].definition`;
        const key = validateSetupPackDefinition(definition, definitionField);
        if (desired.expectedRevision !== undefined &&
            (!isInteger(desired.expectedRevision) || desired.expectedRevision < 0)) {
            throw new Error(`custd: reportingPacks[${index}].expectedRevision must be a non-negative integer`);
        }
        if (Object.keys(desired).includes("clientSecret")) {
            throw new Error("custd: client secrets are managed by Custd");
        }
        if (seen.has(key))
            throw new Error(`custd: duplicate reporting pack ${key}`);
        seen.add(key);
    });
}
function validateSetupPackDefinition(definition, field) {
    const key = setupString(definition.key, `${field}.key`);
    setupString(definition.displayName, `${field}.displayName`);
    setupString(definition.owner, `${field}.owner`);
    if (!isInteger(definition.version) || definition.version < 1) {
        throw new Error(`custd: ${field}.version must be a positive integer`);
    }
    if (typeof definition.enabled !== "boolean") {
        throw new Error(`custd: ${field}.enabled must be a boolean`);
    }
    setupStringArray(definition.eventTypes, `${field}.eventTypes`);
    validateSetupPackMetrics(definition.metrics, `${field}.metrics`);
    validateSetupPackDimensions(definition.dimensions, `${field}.dimensions`);
    validateSetupPackTemplates(definition.templates, `${field}.templates`);
    validateSetupPackTrust(definition.trust, `${field}.trust`);
    validateSetupPackProof(definition.proof, `${field}.proof`);
    if (definition.identity !== undefined)
        validateSetupPackIdentity(definition.identity, `${field}.identity`);
    return key;
}
function validateSetupPackMetrics(metrics, field) {
    if (!Array.isArray(metrics) || metrics.length === 0) {
        throw new Error(`custd: ${field} must be a non-empty array`);
    }
    metrics.forEach((entry, index) => {
        const metric = setupRecord(entry, `${field}[${index}]`);
        setupString(metric.key, `${field}[${index}].key`);
        setupString(metric.label, `${field}[${index}].label`);
        setupString(metric.kind, `${field}[${index}].kind`);
        setupString(metric.calculation, `${field}[${index}].calculation`);
    });
}
function validateSetupPackDimensions(dimensions, field) {
    if (!Array.isArray(dimensions))
        throw new Error(`custd: ${field} must be an array`);
    dimensions.forEach((entry, index) => {
        const dimension = setupRecord(entry, `${field}[${index}]`);
        const key = setupString(dimension.key, `${field}[${index}].key`);
        setupString(dimension.label, `${field}[${index}].label`);
        if (key !== "environment" || dimension.selector !== undefined) {
            setupString(dimension.selector, `${field}[${index}].selector`);
        }
    });
}
function validateSetupPackTemplates(templates, field) {
    if (!Array.isArray(templates) || templates.length === 0) {
        throw new Error(`custd: ${field} must be a non-empty array`);
    }
    templates.forEach((entry, index) => {
        const template = setupRecord(entry, `${field}[${index}]`);
        const templateField = `${field}[${index}]`;
        setupString(template.name, `${templateField}.name`);
        setupStringArray(template.allowedMetrics, `${templateField}.allowedMetrics`);
        setupStringArray(template.sourceModes, `${templateField}.sourceModes`);
        if (!isInteger(template.maxRows) || template.maxRows < 1) {
            throw new Error(`custd: ${templateField}.maxRows must be a positive integer`);
        }
        setupStringArray(template.eventTypes, `${templateField}.eventTypes`);
        setupString(template.aggregation, `${templateField}.aggregation`);
        if (template.allowedDimensions !== undefined) {
            setupStringArray(template.allowedDimensions, `${templateField}.allowedDimensions`, false);
        }
        if (template.allowedFilters !== undefined) {
            validateSetupPackFilters(template.allowedFilters, `${templateField}.allowedFilters`);
        }
        if (template.compositionRules !== undefined) {
            setupStringArray(template.compositionRules, `${templateField}.compositionRules`, false);
        }
        if (template.defaultRange !== undefined)
            setupString(template.defaultRange, `${templateField}.defaultRange`);
        if (template.subjectScope !== undefined) {
            const scope = setupRecord(template.subjectScope, `${templateField}.subjectScope`);
            if (typeof scope.required !== "boolean") {
                throw new Error(`custd: ${templateField}.subjectScope.required must be a boolean`);
            }
            setupString(scope.dimension, `${templateField}.subjectScope.dimension`);
        }
    });
}
function validateSetupPackFilters(filters, field) {
    if (!Array.isArray(filters))
        throw new Error(`custd: ${field} must be an array`);
    filters.forEach((entry, index) => {
        const filter = setupRecord(entry, `${field}[${index}]`);
        setupString(filter.dimension, `${field}[${index}].dimension`);
        setupStringArray(filter.operators, `${field}[${index}].operators`);
    });
}
function validateSetupPackTrust(trust, field) {
    const value = setupRecord(trust, field);
    setupStringArray(value.safeFields, `${field}.safeFields`, false);
    setupStringArray(value.redactionGuard, `${field}.redactionGuard`, false);
}
function validateSetupPackProof(proof, field) {
    const value = setupRecord(proof, field);
    setupString(value.key, `${field}.key`);
    setupStringArray(value.templates, `${field}.templates`, false);
    setupStringArray(value.safeMetadataFields, `${field}.safeMetadataFields`, false);
    setupStringArray(value.forbiddenFields, `${field}.forbiddenFields`, false);
    setupString(value.outputLayout, `${field}.outputLayout`);
}
function validateSetupPackIdentity(identity, field) {
    const value = setupRecord(identity, field);
    for (const key of ["subject", "session", "entity", "cohort", "correlation"]) {
        if (value[key] === undefined)
            continue;
        const selector = setupRecord(value[key], `${field}.${key}`);
        setupString(selector.selector, `${field}.${key}.selector`);
        setupString(selector.type, `${field}.${key}.type`);
    }
}
function setupStringArray(value, field, requireEntries = true) {
    if (!Array.isArray(value) ||
        (requireEntries && value.length === 0) ||
        !value.every((item) => typeof item === "string")) {
        throw new Error(`custd: ${field} must be ${requireEntries ? "a non-empty " : "an "}array of strings`);
    }
}
function validateSetupOAuthClients(clients) {
    if (clients === undefined)
        return;
    if (!Array.isArray(clients))
        throw new Error("custd: manifest oauthClients must be an array");
    const seen = new Set();
    clients.forEach((entry, index) => {
        const client = setupRecord(entry, `oauthClients[${index}]`);
        const clientId = setupString(client.clientId, `oauthClients[${index}].clientId`);
        if (!setupPurposeProfiles.includes(client.purposeProfile)) {
            throw new Error(`custd: oauthClients[${index}].purposeProfile is unsupported`);
        }
        if (client.name !== undefined && typeof client.name !== "string") {
            throw new Error(`custd: oauthClients[${index}].name must be a string`);
        }
        if (client.rotateSecret !== undefined && typeof client.rotateSecret !== "boolean") {
            throw new Error(`custd: oauthClients[${index}].rotateSecret must be a boolean`);
        }
        if (Object.keys(client).includes("clientSecret")) {
            throw new Error("custd: client secrets are managed by Custd");
        }
        if (seen.has(clientId))
            throw new Error(`custd: duplicate oauth client ${clientId}`);
        seen.add(clientId);
    });
}
function setupRecord(value, field) {
    if (!isRecord(value))
        throw new Error(`custd: ${field} must be an object`);
    return value;
}
function setupString(value, field) {
    if (typeof value !== "string" || value.trim() === "")
        throw new Error(`custd: ${field} must be non-empty`);
    return value;
}
function isInteger(value) {
    return typeof value === "number" && Number.isInteger(value);
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function setupWaitDuration(value, fallback, field) {
    const duration = value ?? fallback;
    if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error(`custd: ${field} must be a positive finite number`);
    }
    return duration;
}
function setupRequestOptions(options) {
    return options.signal ? { signal: options.signal } : undefined;
}
function waitForSetupReadiness(intervalMs, signal) {
    return new Promise((resolve, reject) => {
        let timer;
        const onAbort = () => {
            if (timer !== undefined)
                clearTimeout(timer);
            reject(signal?.reason ?? new Error("custd: tenant manifest readiness wait aborted"));
        };
        if (signal?.aborted) {
            onAbort();
            return;
        }
        timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, intervalMs);
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
function readinessTimeoutError(tenantSlug, readiness, timeoutMs) {
    const code = readiness.safeNextActionCode || "unknown";
    return new Error(`custd: timed out waiting for tenant manifest readiness for "${tenantSlug}" after ${timeoutMs}ms ` +
        `(action=${readiness.safeNextAction || "unknown"}, code=${code})`);
}
async function persistSetupCredentials(credentials, persistCredentials) {
    if (!credentials || credentials.length === 0)
        return;
    if (typeof persistCredentials !== "function") {
        throw new Error("custd: tenant manifest returned secrets without a one-time credential persistence callback");
    }
    try {
        await persistCredentials(credentials);
    }
    catch {
        throw new Error("custd: tenant manifest applied but one-time credential persistence failed; reconcile before retrying");
    }
}
export class ClientSetupClient {
    constructor(request) {
        this.request = request;
    }
    async apply(tenantSlug, manifest, options) {
        validateClientSetupManifest(manifest);
        return this.request("PUT", `/tenant-manifest/${encodeURIComponent(tenantSlug)}`, manifest, options);
    }
    readiness(tenantSlug, options) {
        return this.request("GET", `/tenant-manifest/${encodeURIComponent(tenantSlug)}/readiness`, undefined, options);
    }
    async applyAndWait(tenantSlug, manifest, options = {}) {
        const timeoutMs = setupWaitDuration(options.timeoutMs, defaultSetupReadinessTimeoutMs, "timeoutMs");
        const intervalMs = setupWaitDuration(options.intervalMs, defaultSetupReadinessIntervalMs, "intervalMs");
        const requestOptions = setupRequestOptions(options);
        const apply = await this.apply(tenantSlug, manifest, requestOptions);
        await persistSetupCredentials(apply.credentials, options.persistCredentials);
        let readiness = apply;
        const deadline = Date.now() + timeoutMs;
        while (!readiness.ready && readiness.safeNextAction === "retry") {
            const remainingMs = deadline - Date.now();
            if (remainingMs <= 0)
                throw readinessTimeoutError(tenantSlug, readiness, timeoutMs);
            await waitForSetupReadiness(Math.min(intervalMs, remainingMs), options.signal);
            readiness = await this.readiness(tenantSlug, requestOptions);
        }
        if (!readiness.ready && readiness.safeNextAction === "retry") {
            throw readinessTimeoutError(tenantSlug, readiness, timeoutMs);
        }
        return { apply, readiness };
    }
}
