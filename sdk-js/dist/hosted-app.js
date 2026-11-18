// Zero-config start for an app Custd hosts: read the app's own discovery file and
// start tracking, error capture and sign-in as the file enables them. Starting
// never throws; every failure comes back as a typed state the app can show.
import { AppItemsClient } from "./app-items.js";
import { BrowserSignIn, signInConfigFromDiscovery, } from "./browser-sign-in.js";
import { createBrowserTracker, defaultSiteBatchSize, defaultSiteConsent, fetchBrowserSiteConfig, siteConfigSchemaVersion, } from "./browser-tracker.js";
import { ErrorCaptureClient, installBrowserErrorCapture } from "./error-capture.js";
export const HOSTED_APP_DISCOVERY_PATH = "/.well-known/custd.json";
export const HOSTED_APP_CAPABILITIES = {
    tracking: "tracking",
    errorCapture: "error_capture",
    appData: "app_data",
    signIn: "sign_in",
};
export const HOSTED_APP_ERROR_CODES = {
    discoveryUnavailable: "discovery_unavailable",
    invalidDiscovery: "invalid_discovery",
    siteConfigUnavailable: "site_config_unavailable",
    capabilityFailed: "capability_failed",
};
export class HostedAppError extends Error {
    constructor(code, message, 
    /** The capability that failed to start; absent when discovery itself failed. */
    capability, status) {
        super(`custd: ${message}`);
        this.code = code;
        this.capability = capability;
        this.status = status;
        this.name = "HostedAppError";
    }
}
export const APP_EVENT_OUTCOMES = {
    /** Handed to the tracker, which still applies consent and Do Not Track. */
    tracked: "tracked",
    /** Tracking is not enabled or did not start; nothing was sent. */
    trackingOff: "tracking_off",
    /** The collector or network refused the event. */
    failed: "failed",
};
export const HOSTED_APP_STATUSES = {
    ready: "ready",
    error: "error",
};
/** Reads the hosted app's discovery file and starts what it enables. Never rejects. */
export async function startHostedApp(options = {}) {
    const fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    let discovery;
    try {
        discovery = await fetchHostedAppDiscovery(options.discoveryUrl ?? defaultDiscoveryUrl(), fetchImpl);
    }
    catch (error) {
        return { status: HOSTED_APP_STATUSES.error, error: toHostedAppError(error) };
    }
    const problems = [];
    const enabled = new Set(discovery.capabilities);
    const errorCapture = enabled.has(HOSTED_APP_CAPABILITIES.errorCapture)
        ? attempt(problems, HOSTED_APP_CAPABILITIES.errorCapture, () => startErrorCapture(discovery, options, fetchImpl))
        : undefined;
    const signIn = enabled.has(HOSTED_APP_CAPABILITIES.signIn)
        ? attempt(problems, HOSTED_APP_CAPABILITIES.signIn, () => createSignIn(discovery, options, fetchImpl))
        : undefined;
    const tracker = enabled.has(HOSTED_APP_CAPABILITIES.tracking)
        ? await startTracking(discovery, options, fetchImpl).catch((error) => {
            problems.push(toCapabilityError(error, HOSTED_APP_CAPABILITIES.tracking));
            return undefined;
        })
        : undefined;
    const appItems = enabled.has(HOSTED_APP_CAPABILITIES.appData)
        ? AppItemsClient.fromDiscovery(discovery, { fetch: options.fetch, userToken: () => liveAccessToken(signIn) })
        : undefined;
    // Ownership is part of every read, so a sign-in, refresh or sign-out re-reads what is watched.
    const unwatchSignIn = appItems && signIn?.subscribe(() => appItems.refreshAll());
    return {
        status: HOSTED_APP_STATUSES.ready,
        app: hostedApp({ discovery, tracker, errorCapture, signIn, appItems, unwatchSignIn, problems }),
    };
}
function hostedApp(pieces) {
    const { tracker, errorCapture } = pieces;
    let stopped = false;
    return {
        discovery: pieces.discovery,
        tracker,
        errorCapture: errorCapture?.client,
        signIn: pieces.signIn,
        appItems: pieces.appItems,
        problems: pieces.problems,
        trackAppEvent: async (name, properties) => {
            if (!tracker || stopped)
                return APP_EVENT_OUTCOMES.trackingOff;
            try {
                await tracker.track(name, { ...properties });
                return APP_EVENT_OUTCOMES.tracked;
            }
            catch {
                return APP_EVENT_OUTCOMES.failed;
            }
        },
        stop: () => {
            if (stopped)
                return;
            stopped = true;
            tracker?.close();
            errorCapture?.uninstall();
            pieces.unwatchSignIn?.();
        },
    };
}
async function fetchHostedAppDiscovery(url, fetchImpl) {
    let response;
    try {
        response = await fetchImpl(url, { credentials: "omit", headers: { accept: "application/json" } });
    }
    catch {
        throw new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "discovery file could not be fetched");
    }
    if (!response.ok) {
        throw new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, `discovery file returned ${response.status}`, undefined, response.status);
    }
    const body = await response.json().catch(() => null);
    return parseHostedAppDiscovery(body);
}
/** Validates a discovery document from the wire. Throws `HostedAppError` when it is unusable. */
function parseHostedAppDiscovery(body) {
    if (!isRecord(body))
        throw invalidDiscovery("discovery file is not a JSON object");
    const fields = ["apiBaseUrl", "host", "siteUuid", "browserKey", "environment"];
    for (const field of fields) {
        if (!nonEmptyString(body[field]))
            throw invalidDiscovery(`discovery file needs ${field}`);
    }
    if (!Array.isArray(body.capabilities))
        throw invalidDiscovery("discovery file needs capabilities");
    const known = new Set(Object.values(HOSTED_APP_CAPABILITIES));
    const discovery = {
        apiBaseUrl: body.apiBaseUrl,
        host: body.host,
        siteUuid: body.siteUuid,
        browserKey: body.browserKey,
        environment: body.environment,
        capabilities: body.capabilities.filter((value) => known.has(value)),
    };
    const signIn = parseSignIn(body.signIn);
    if (signIn)
        discovery.signIn = signIn;
    if (body.identityMode === "cookieless" || body.identityMode === "extended")
        discovery.identityMode = body.identityMode;
    if (Array.isArray(body.allowedOrigins) && body.allowedOrigins.every((origin) => typeof origin === "string")) {
        discovery.allowedOrigins = body.allowedOrigins;
    }
    if (typeof body.pageViewSchemaVersion === "string" && body.pageViewSchemaVersion !== "")
        discovery.pageViewSchemaVersion = body.pageViewSchemaVersion;
    return discovery;
}
function parseSignIn(value) {
    if (!isRecord(value))
        return undefined;
    const fields = ["issuer", "authorizationEndpoint", "tokenEndpoint", "clientId", "audience", "redirectUri"];
    if (!fields.every((field) => nonEmptyString(value[field])))
        return undefined;
    const signIn = {
        issuer: value.issuer,
        authorizationEndpoint: value.authorizationEndpoint,
        tokenEndpoint: value.tokenEndpoint,
        clientId: value.clientId,
        audience: value.audience,
        redirectUri: value.redirectUri,
    };
    if (nonEmptyString(value.endSessionEndpoint))
        signIn.endSessionEndpoint = value.endSessionEndpoint;
    if (nonEmptyString(value.postLogoutRedirectUri))
        signIn.postLogoutRedirectUri = value.postLogoutRedirectUri;
    return signIn;
}
async function startTracking(discovery, options, fetchImpl) {
    const siteConfig = await hostedSiteConfig(discovery, fetchImpl);
    const tracker = createBrowserTracker({
        baseUrl: discovery.apiBaseUrl,
        siteUuid: discovery.siteUuid,
        writeKey: discovery.browserKey,
        environment: discovery.environment,
        identityMode: siteConfig.identityMode,
        allowedOrigins: siteConfig.allowedOrigins,
        pageViewSchemaVersion: siteConfigSchemaVersion(siteConfig.pageViewSchemaVersion),
        batchSize: defaultSiteBatchSize(siteConfig),
        consent: options.consent ?? defaultSiteConsent(siteConfig),
        pageContext: options.pageContext,
    });
    tracker.installSpaTracking();
    return tracker;
}
/** The discovery file's copy of the Site config, or the Site config route for an older backend. */
async function hostedSiteConfig(discovery, fetchImpl) {
    if (discovery.identityMode && discovery.allowedOrigins && discovery.pageViewSchemaVersion) {
        return {
            identityMode: discovery.identityMode,
            allowedOrigins: discovery.allowedOrigins,
            pageViewSchemaVersion: discovery.pageViewSchemaVersion,
        };
    }
    return fetchBrowserSiteConfig(discovery.apiBaseUrl, discovery.siteUuid, fetchImpl).catch(() => {
        throw new HostedAppError(HOSTED_APP_ERROR_CODES.siteConfigUnavailable, "site config could not be read", HOSTED_APP_CAPABILITIES.tracking);
    });
}
/** Starts a refresh this long before the access token expires, so long-open pages stay signed in. */
const ACCESS_TOKEN_REFRESH_MS = 30000;
/**
 * The signed-in user's access token while it is still valid. Near expiry it starts `restore()`,
 * which refreshes the session (one shared request) or signs out with a visible error state.
 */
function liveAccessToken(signIn) {
    const session = signIn?.currentSession();
    if (!signIn || !session)
        return undefined;
    if (session.expiresAtMs - ACCESS_TOKEN_REFRESH_MS <= Date.now())
        void signIn.restore();
    return session.expiresAtMs > Date.now() ? session.accessToken : undefined;
}
function startErrorCapture(discovery, options, fetchImpl) {
    const client = new ErrorCaptureClient({
        baseUrl: discovery.apiBaseUrl,
        writeKey: discovery.browserKey,
        environment: discovery.environment,
        release: options.release,
        fetch: fetchImpl,
    });
    return { client, uninstall: installBrowserErrorCapture(client) };
}
function createSignIn(discovery, options, fetchImpl) {
    const endpoints = signInConfigFromDiscovery(discovery, {
        redirectUri: discovery.signIn?.redirectUri ?? "",
        scopes: options.signInScopes,
    });
    return new BrowserSignIn({ ...endpoints, fetch: fetchImpl, storage: options.signInStorage });
}
function attempt(problems, capability, start) {
    try {
        return start();
    }
    catch (error) {
        problems.push(toCapabilityError(error, capability));
        return undefined;
    }
}
function toCapabilityError(error, capability) {
    if (error instanceof HostedAppError)
        return error;
    return new HostedAppError(HOSTED_APP_ERROR_CODES.capabilityFailed, `${capability} could not start`, capability);
}
function toHostedAppError(error) {
    if (error instanceof HostedAppError)
        return error;
    return new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "discovery file could not be read");
}
function defaultDiscoveryUrl() {
    if (typeof window === "undefined") {
        throw new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "no page origin to read discovery from");
    }
    return new URL(HOSTED_APP_DISCOVERY_PATH, window.location.origin).toString();
}
function invalidDiscovery(message) {
    return new HostedAppError(HOSTED_APP_ERROR_CODES.invalidDiscovery, message);
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nonEmptyString(value) {
    return typeof value === "string" && value !== "";
}
