function nonEmpty(value) {
    return typeof value === "string" && value.trim() !== "";
}
function validateText(name, value) {
    if (!nonEmpty(value))
        throw new Error(`Custd readiness requires ${name}`);
}
function normalizeEndpoint(name, value) {
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        throw new Error(`Custd readiness ${name} is not a valid URL`);
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
        throw new Error(`Custd readiness ${name} must not contain credentials or URL query data`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`Custd readiness ${name} must use HTTP or HTTPS`);
    }
    return value.replace(/\/+$/u, "");
}
function validateOptions(options) {
    validateText("base URL", options.baseUrl);
    validateText("tenant slug", options.tenantSlug);
    validateText("event type", options.eventTypeSlug);
    validateText("schema version", options.schemaVersion);
    if (!Array.isArray(options.oauth) || options.oauth.length === 0) {
        throw new Error("Custd readiness requires at least one OAuth credential");
    }
    const names = new Set();
    for (const credential of options.oauth) {
        validateText("OAuth credential name", credential?.name);
        if (names.has(credential.name)) {
            throw new Error(`Custd readiness has duplicate OAuth credential name "${credential.name}"`);
        }
        names.add(credential.name);
        validateText(`OAuth credential "${credential.name}" client ID`, credential.clientId);
        validateText(`OAuth credential "${credential.name}" client secret`, credential.clientSecret);
        validateText(`OAuth credential "${credential.name}" token URL`, credential.tokenUrl);
    }
}
async function request(fetchImpl, input, init, label) {
    try {
        return await fetchImpl(input, init);
    }
    catch {
        throw new Error(`Custd readiness ${label} request failed`);
    }
}
async function requireOk(fetchImpl, input, init, label) {
    const response = await request(fetchImpl, input, init, label);
    if (!response.ok) {
        throw new Error(`Custd readiness ${label} failed (HTTP ${response.status})`);
    }
    return response;
}
async function readJson(response, label) {
    try {
        return await response.json();
    }
    catch {
        throw new Error(`Custd readiness ${label} returned invalid JSON`);
    }
}
async function issueToken(fetchImpl, credential) {
    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credential.clientId,
        client_secret: credential.clientSecret,
        ...(credential.audience ? { audience: credential.audience } : {}),
        ...(credential.scopes?.length ? { scope: credential.scopes.join(" ") } : {}),
    });
    const response = await requireOk(fetchImpl, normalizeEndpoint("token URL", credential.tokenUrl), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    }, `credential "${credential.name}" token issuance`);
    const token = await readJson(response, `credential "${credential.name}" token issuance`);
    if (!token || typeof token !== "object" || !nonEmpty(token.access_token)) {
        throw new Error(`Custd readiness credential "${credential.name}" token issuance returned no access token`);
    }
    return token.access_token;
}
function accountTenant(account) {
    if (!account || typeof account !== "object")
        return undefined;
    const record = account;
    if (nonEmpty(record.companySlug))
        return record.companySlug;
    return nonEmpty(record.tenant?.slug) ? record.tenant.slug : undefined;
}
async function verifyTenantBinding(fetchImpl, baseUrl, credential, token, tenantSlug) {
    const response = await requireOk(fetchImpl, `${baseUrl}/api/v1/account/me`, { headers: { Authorization: `Bearer ${token}` } }, `credential "${credential.name}" tenant binding`);
    const account = await readJson(response, `credential "${credential.name}" tenant binding`);
    if (accountTenant(account) !== tenantSlug) {
        throw new Error(`Custd readiness credential "${credential.name}" tenant binding failed`);
    }
}
function schemaVersions(body) {
    if (Array.isArray(body))
        return body;
    if (body && typeof body === "object") {
        const record = body;
        if (Array.isArray(record.versions))
            return record.versions;
        if (Array.isArray(record.schemas))
            return record.schemas;
    }
    return [];
}
async function verifyActiveSchema(fetchImpl, schemaUrl, token, eventTypeSlug, schemaVersion) {
    const path = `/api/v1/schemas/${encodeURIComponent(eventTypeSlug)}/versions`;
    const response = await requireOk(fetchImpl, schemaUrl + path, { headers: { Authorization: `Bearer ${token}` } }, "active schema");
    const versions = schemaVersions(await readJson(response, "active schema"));
    const selected = versions.find((version) => version && typeof version === "object" && version.version === schemaVersion);
    if (!selected || (selected.isActive !== true && selected.enabled !== true)) {
        throw new Error(`Custd readiness active schema "${eventTypeSlug}@${schemaVersion}" is not active`);
    }
}
export async function checkRuntimeReadiness(options) {
    validateOptions(options);
    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function")
        throw new Error("Custd readiness requires fetch");
    const baseUrl = normalizeEndpoint("base URL", options.baseUrl);
    const schemaUrl = normalizeEndpoint("schema URL", options.schemaUrl ?? options.baseUrl);
    await requireOk(fetchImpl, `${baseUrl}/health`, undefined, "endpoint");
    const issued = [];
    for (const credential of options.oauth) {
        const token = await issueToken(fetchImpl, credential);
        await verifyTenantBinding(fetchImpl, baseUrl, credential, token, options.tenantSlug);
        issued.push({ credential, token });
    }
    await verifyActiveSchema(fetchImpl, schemaUrl, issued[0].token, options.eventTypeSlug, options.schemaVersion);
    return {
        ready: true,
        tenantSlug: options.tenantSlug,
        eventTypeSlug: options.eventTypeSlug,
        schemaVersion: options.schemaVersion,
        credentials: issued.map(({ credential }) => ({
            name: credential.name,
            tenantSlug: options.tenantSlug,
            tokenIssued: true,
        })),
    };
}
