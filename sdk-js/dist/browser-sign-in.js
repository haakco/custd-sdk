// Browser sign-in for app users: OAuth 2.0 authorization code with PKCE (RFC 7636).
//
// The app is a public client, so no client secret is involved. Pending sign-in
// state and the token set live in sessionStorage by default. Tokens are never
// placed in error messages.
export const SIGN_IN_STATUSES = {
    signedOut: "signed_out",
    signingIn: "signing_in",
    signedIn: "signed_in",
    error: "error",
};
export const SIGN_IN_ERROR_CODES = {
    invalidDiscovery: "invalid_discovery",
    missingPendingSignIn: "missing_pending_sign_in",
    stateMismatch: "state_mismatch",
    issuerMismatch: "issuer_mismatch",
    authorizationDenied: "authorization_denied",
    missingCode: "missing_code",
    tokenRequestFailed: "token_request_failed",
    invalidTokenResponse: "invalid_token_response",
    noRefreshToken: "no_refresh_token",
};
export class SignInError extends Error {
    /** @param oauthError OAuth `error` value from the authorization server, when it sent one. */
    constructor(code, message, oauthError, status) {
        super(`custd: ${message}`);
        this.code = code;
        this.oauthError = oauthError;
        this.status = status;
        this.name = "SignInError";
    }
}
export const DEFAULT_SIGN_IN_SCOPES = ["openid", "profile", "offline_access"];
const STORAGE_PREFIX = "custd:sign-in";
const EXPIRY_SKEW_MS = 30000;
const RANDOM_BYTES = 32;
/** Reads and validates the sign-in endpoints from a discovery document. */
export function signInConfigFromDiscovery(document, options) {
    const signIn = document.signIn;
    if (!signIn) {
        throw new SignInError(SIGN_IN_ERROR_CODES.invalidDiscovery, "discovery document has no signIn section");
    }
    const config = {
        issuer: signIn.issuer,
        authorizationEndpoint: signIn.authorizationEndpoint,
        tokenEndpoint: signIn.tokenEndpoint,
        clientId: signIn.clientId,
        redirectUri: options.redirectUri,
    };
    if (signIn.endSessionEndpoint)
        config.endSessionEndpoint = signIn.endSessionEndpoint;
    if (signIn.audience)
        config.audience = signIn.audience;
    if (options.scopes)
        config.scopes = options.scopes;
    validateEndpoints(config);
    return config;
}
/** RFC 7636 S256 challenge: base64url(SHA-256(verifier)) without padding. */
export async function createSignInCodeChallenge(codeVerifier) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    return base64Url(new Uint8Array(digest));
}
export class BrowserSignIn {
    constructor(config) {
        this.listeners = new Set();
        this.completion = null;
        this.refresh = null;
        validateEndpoints(config);
        const { storage, fetch: fetchImpl, now, navigate, ...endpoints } = config;
        this.config = endpoints;
        this.storage = storage ?? defaultStorage();
        this.fetchImpl = fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
        this.now = now ?? Date.now;
        this.navigate = navigate ?? ((url) => window.location.assign(url));
        this.state = this.initialState();
    }
    /** Current state for UI bindings; replaced (never mutated) on each change. */
    getState() {
        return this.state;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /** Stored session, or null. It may be expired; use `restore` to refresh it. */
    currentSession() {
        const stored = readJson(this.storage, this.storageKey("session"));
        return isSession(stored) ? stored : null;
    }
    /** Creates and stores PKCE state, and returns the authorize URL. */
    async startSignIn(options = {}) {
        const pending = {
            state: randomToken(),
            codeVerifier: randomToken(),
            returnTo: safeReturnTo(options.returnTo ?? currentPath()),
        };
        this.storage.setItem(this.storageKey("pending"), JSON.stringify(pending));
        const url = new URL(this.config.authorizationEndpoint);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("client_id", this.config.clientId);
        url.searchParams.set("redirect_uri", this.config.redirectUri);
        url.searchParams.set("scope", this.scopes().join(" "));
        url.searchParams.set("state", pending.state);
        url.searchParams.set("code_challenge", await createSignInCodeChallenge(pending.codeVerifier));
        url.searchParams.set("code_challenge_method", "S256");
        if (this.config.audience)
            url.searchParams.set("audience", this.config.audience);
        return { authorizationUrl: url.toString() };
    }
    /** Starts sign-in and sends the browser to the authorization endpoint. */
    async signIn(options = {}) {
        this.setState({ status: SIGN_IN_STATUSES.signingIn });
        try {
            const start = await this.startSignIn(options);
            this.navigate(start.authorizationUrl);
        }
        catch (error) {
            this.setState({ status: SIGN_IN_STATUSES.error, error: toSignInError(error) });
            throw error;
        }
    }
    /** Validates the redirect and exchanges its code. Pending state is single-use. */
    completeSignIn(callbackUrl) {
        this.completion ?? (this.completion = this.exchangeCallback(callbackUrl).finally(() => {
            this.completion = null;
        }));
        return this.completion;
    }
    /** Exchanges the stored refresh token. Concurrent calls share one request. */
    refreshSession() {
        this.refresh ?? (this.refresh = this.exchangeRefreshToken().finally(() => {
            this.refresh = null;
        }));
        return this.refresh;
    }
    /**
     * Settles state on page load: completes a sign-in redirect when `url` is the
     * redirect URI, otherwise reads the stored session and refreshes it if expired.
     */
    async restore(url = currentHref()) {
        if (this.isPendingCallback(url)) {
            this.setState({ status: SIGN_IN_STATUSES.signingIn });
            try {
                const completion = await this.completeSignIn(url);
                return { state: this.state, returnTo: completion.returnTo };
            }
            catch (error) {
                this.setState({ status: SIGN_IN_STATUSES.error, error: toSignInError(error) });
                return { state: this.state };
            }
        }
        const session = this.currentSession();
        if (session && session.expiresAtMs - EXPIRY_SKEW_MS <= this.now() && session.refreshToken) {
            try {
                await this.refreshSession();
            }
            catch (error) {
                this.storage.removeItem(this.storageKey("session"));
                this.setState({ status: SIGN_IN_STATUSES.error, error: toSignInError(error) });
            }
        }
        else if (!session || session.expiresAtMs <= this.now()) {
            this.clearSession();
        }
        return { state: this.state };
    }
    /**
     * Clears local sign-in state. When the provider has an end-session endpoint,
     * sends the browser there and returns its URL.
     */
    signOut(options = {}) {
        const idToken = this.currentSession()?.idToken;
        this.storage.removeItem(this.storageKey("pending"));
        this.clearSession();
        if (!this.config.endSessionEndpoint)
            return {};
        const url = new URL(this.config.endSessionEndpoint);
        url.searchParams.set("client_id", this.config.clientId);
        if (idToken)
            url.searchParams.set("id_token_hint", idToken);
        if (options.postLogoutRedirectUri)
            url.searchParams.set("post_logout_redirect_uri", options.postLogoutRedirectUri);
        const endSessionUrl = url.toString();
        this.navigate(endSessionUrl);
        return { endSessionUrl };
    }
    initialState() {
        if (this.isPendingCallback(currentHref()))
            return { status: SIGN_IN_STATUSES.signingIn };
        const session = this.currentSession();
        return session ? { status: SIGN_IN_STATUSES.signedIn, session } : { status: SIGN_IN_STATUSES.signedOut };
    }
    async exchangeCallback(callbackUrl) {
        const params = new URL(callbackUrl).searchParams;
        const pending = this.takePending();
        if (!pending) {
            throw new SignInError(SIGN_IN_ERROR_CODES.missingPendingSignIn, "no sign-in is in progress in this tab");
        }
        if (params.get("state") !== pending.state) {
            throw new SignInError(SIGN_IN_ERROR_CODES.stateMismatch, "sign-in state does not match; the redirect was refused");
        }
        const issuer = params.get("iss");
        if (issuer !== null && issuer !== this.config.issuer) {
            throw new SignInError(SIGN_IN_ERROR_CODES.issuerMismatch, "sign-in redirect came from an unexpected issuer");
        }
        const oauthError = params.get("error");
        if (oauthError !== null) {
            throw new SignInError(SIGN_IN_ERROR_CODES.authorizationDenied, "sign-in was not completed", oauthError);
        }
        const code = params.get("code");
        if (!code)
            throw new SignInError(SIGN_IN_ERROR_CODES.missingCode, "sign-in redirect has no code");
        const session = await this.requestTokens({
            grant_type: "authorization_code",
            code,
            redirect_uri: this.config.redirectUri,
            client_id: this.config.clientId,
            code_verifier: pending.codeVerifier,
        });
        this.saveSession(session);
        return { session, returnTo: pending.returnTo };
    }
    async exchangeRefreshToken() {
        const refreshToken = this.currentSession()?.refreshToken;
        if (!refreshToken)
            throw new SignInError(SIGN_IN_ERROR_CODES.noRefreshToken, "session has no refresh token");
        const session = await this.requestTokens({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: this.config.clientId }, refreshToken);
        this.saveSession(session);
        return session;
    }
    async requestTokens(form, previousRefreshToken) {
        const response = await this.fetchImpl(this.config.tokenEndpoint, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
            body: new URLSearchParams(form).toString(),
        });
        const body = (await response.json().catch(() => ({})));
        if (!response.ok) {
            const oauthError = typeof body.error === "string" ? body.error : undefined;
            throw new SignInError(SIGN_IN_ERROR_CODES.tokenRequestFailed, `token endpoint returned ${response.status}${oauthError ? ` (${oauthError})` : ""}`, oauthError, response.status);
        }
        return this.sessionFromTokenResponse(body, previousRefreshToken);
    }
    sessionFromTokenResponse(body, previousRefreshToken) {
        if (typeof body.access_token !== "string" ||
            typeof body.token_type !== "string" ||
            typeof body.expires_in !== "number") {
            throw new SignInError(SIGN_IN_ERROR_CODES.invalidTokenResponse, "token response needs access_token, token_type and expires_in");
        }
        const session = {
            accessToken: body.access_token,
            tokenType: body.token_type,
            expiresAtMs: this.now() + body.expires_in * 1000,
            scopes: typeof body.scope === "string" ? body.scope.split(" ").filter(Boolean) : this.scopes(),
        };
        const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token : previousRefreshToken;
        if (refreshToken)
            session.refreshToken = refreshToken;
        const idToken = typeof body.id_token === "string" ? body.id_token : this.currentSession()?.idToken;
        if (idToken)
            session.idToken = idToken;
        return session;
    }
    /** A redirect back to the app while this tab has a sign-in in progress. */
    isPendingCallback(url) {
        if (this.completion === null && this.storage.getItem(this.storageKey("pending")) === null)
            return false;
        const current = new URL(url);
        const redirect = new URL(this.config.redirectUri);
        return (current.origin === redirect.origin &&
            current.pathname === redirect.pathname &&
            (current.searchParams.has("code") || current.searchParams.has("error")));
    }
    takePending() {
        const key = this.storageKey("pending");
        const stored = readJson(this.storage, key);
        this.storage.removeItem(key);
        return isPending(stored) ? stored : null;
    }
    saveSession(session) {
        this.storage.setItem(this.storageKey("session"), JSON.stringify(session));
        this.setState({ status: SIGN_IN_STATUSES.signedIn, session });
    }
    clearSession() {
        this.storage.removeItem(this.storageKey("session"));
        this.setState({ status: SIGN_IN_STATUSES.signedOut });
    }
    setState(state) {
        this.state = state;
        for (const listener of this.listeners)
            listener();
    }
    scopes() {
        return this.config.scopes ? [...this.config.scopes] : [...DEFAULT_SIGN_IN_SCOPES];
    }
    storageKey(kind) {
        return `${STORAGE_PREFIX}:${this.config.clientId}:${kind}`;
    }
}
function validateEndpoints(config) {
    for (const field of ["issuer", "authorizationEndpoint", "tokenEndpoint", "clientId", "redirectUri"]) {
        if (typeof config[field] !== "string" || config[field] === "") {
            throw new SignInError(SIGN_IN_ERROR_CODES.invalidDiscovery, `sign-in ${field} is required`);
        }
    }
    for (const field of ["authorizationEndpoint", "tokenEndpoint", "redirectUri"]) {
        assertSecureOrLocalHTTP(config[field], field);
    }
    if (config.endSessionEndpoint)
        assertSecureOrLocalHTTP(config.endSessionEndpoint, "endSessionEndpoint");
}
function assertSecureOrLocalHTTP(rawUrl, field) {
    const parsed = new URL(rawUrl);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local)) {
        throw new SignInError(SIGN_IN_ERROR_CODES.invalidDiscovery, `sign-in ${field} must use https unless it targets localhost`);
    }
}
function randomToken() {
    return base64Url(crypto.getRandomValues(new Uint8Array(RANDOM_BYTES)));
}
function base64Url(bytes) {
    let binary = "";
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function safeReturnTo(path) {
    return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
function currentPath() {
    if (typeof window === "undefined")
        return "/";
    const { pathname, search, hash } = window.location;
    return `${pathname}${search}${hash}`;
}
function currentHref() {
    return typeof window === "undefined" ? "http://localhost/" : window.location.href;
}
function readJson(storage, key) {
    const raw = storage.getItem(key);
    if (raw === null)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        storage.removeItem(key);
        return null;
    }
}
function isPending(value) {
    const record = value;
    return (typeof record?.state === "string" && typeof record.codeVerifier === "string" && typeof record.returnTo === "string");
}
function isSession(value) {
    const record = value;
    return (typeof record?.accessToken === "string" &&
        typeof record.tokenType === "string" &&
        typeof record.expiresAtMs === "number" &&
        Array.isArray(record.scopes));
}
function toSignInError(error) {
    if (error instanceof SignInError)
        return error;
    return new SignInError(SIGN_IN_ERROR_CODES.tokenRequestFailed, "sign-in request failed");
}
function defaultStorage() {
    if (typeof sessionStorage !== "undefined")
        return sessionStorage;
    const items = new Map();
    return {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => {
            items.set(key, value);
        },
        removeItem: (key) => {
            items.delete(key);
        },
    };
}
