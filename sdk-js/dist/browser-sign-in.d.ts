import { type OpenAppAccountSettingsOptions } from "./app-account.js";
/** Sign-in block of the hosted app discovery file `/.well-known/custd.json`. */
export type CustdDiscoverySignIn = {
    issuer: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    endSessionEndpoint?: string;
    /** Where the provider returns the browser after sign-out; `signOut` uses it by default. */
    postLogoutRedirectUri?: string;
    clientId: string;
    /** The API audience the access token is issued for; sent as the authorize `audience` parameter. */
    audience?: string;
};
/** The parts of `/.well-known/custd.json` that sign-in reads. */
export type CustdDiscoveryDocument = {
    signIn?: CustdDiscoverySignIn;
};
/** Minimal storage contract; `sessionStorage` satisfies it. */
export type SignInStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type BrowserSignInEndpoints = CustdDiscoverySignIn & {
    redirectUri: string;
    scopes?: string[];
};
export type BrowserSignInConfig = BrowserSignInEndpoints & {
    storage?: SignInStorage;
    fetch?: typeof fetch;
    now?: () => number;
    navigate?: (url: string) => void;
    /** Opens hosted account settings after a sign-in settings asked for; replace it in tests. */
    openAccountSettings?: (options: OpenAppAccountSettingsOptions) => Promise<void>;
};
export type SignInDiscoveryOptions = {
    redirectUri: string;
    scopes?: string[];
};
/** Tokens returned by the token endpoint, with an absolute expiry. */
export type SignInSession = {
    accessToken: string;
    tokenType: string;
    expiresAtMs: number;
    refreshToken?: string;
    idToken?: string;
    scopes: string[];
};
export type SignInStartOptions = {
    /** Same-origin path to return to after sign-in. Defaults to the current page. */
    returnTo?: string;
    /** Reopen hosted account settings, linking back to `returnTo`, once sign-in completes. */
    openAccountSettings?: boolean;
};
export type SignInStart = {
    authorizationUrl: string;
};
export type SignInCompletion = {
    session: SignInSession;
    returnTo: string;
    openAccountSettings?: boolean;
};
export type SignOutOptions = {
    postLogoutRedirectUri?: string;
};
export type SignOutResult = {
    endSessionUrl?: string;
};
export declare const SIGN_IN_STATUSES: {
    readonly signedOut: "signed_out";
    readonly signingIn: "signing_in";
    readonly signedIn: "signed_in";
    readonly error: "error";
};
export type SignInStatus = (typeof SIGN_IN_STATUSES)[keyof typeof SIGN_IN_STATUSES];
export type SignInState = {
    status: typeof SIGN_IN_STATUSES.signedOut;
} | {
    status: typeof SIGN_IN_STATUSES.signingIn;
} | {
    status: typeof SIGN_IN_STATUSES.signedIn;
    session: SignInSession;
} | {
    status: typeof SIGN_IN_STATUSES.error;
    error: SignInError;
};
export type SignInRestoreResult = {
    state: SignInState;
    /** Set when this page load completed a sign-in redirect. */
    returnTo?: string;
};
export declare const SIGN_IN_ERROR_CODES: {
    readonly invalidDiscovery: "invalid_discovery";
    readonly missingPendingSignIn: "missing_pending_sign_in";
    readonly stateMismatch: "state_mismatch";
    readonly issuerMismatch: "issuer_mismatch";
    readonly authorizationDenied: "authorization_denied";
    readonly missingCode: "missing_code";
    readonly tokenRequestFailed: "token_request_failed";
    readonly invalidTokenResponse: "invalid_token_response";
    readonly noRefreshToken: "no_refresh_token";
};
export type SignInErrorCode = (typeof SIGN_IN_ERROR_CODES)[keyof typeof SIGN_IN_ERROR_CODES];
export declare class SignInError extends Error {
    readonly code: SignInErrorCode;
    readonly oauthError?: string | undefined;
    readonly status?: number | undefined;
    /** @param oauthError OAuth `error` value from the authorization server, when it sent one. */
    constructor(code: SignInErrorCode, message: string, oauthError?: string | undefined, status?: number | undefined);
}
export declare const DEFAULT_SIGN_IN_SCOPES: readonly string[];
/** Reads and validates the sign-in endpoints from a discovery document. */
export declare function signInConfigFromDiscovery(document: CustdDiscoveryDocument, options: SignInDiscoveryOptions): BrowserSignInEndpoints;
/** RFC 7636 S256 challenge: base64url(SHA-256(verifier)) without padding. */
export declare function createSignInCodeChallenge(codeVerifier: string): Promise<string>;
export declare class BrowserSignIn {
    private readonly config;
    private readonly storage;
    private readonly fetchImpl;
    private readonly now;
    private readonly navigate;
    private readonly openAccountSettings;
    private readonly listeners;
    private state;
    private completion;
    private refresh;
    constructor(config: BrowserSignInConfig);
    /** Current state for UI bindings; replaced (never mutated) on each change. */
    getState(): SignInState;
    subscribe(listener: () => void): () => void;
    /** Stored session, or null. It may be expired; use `restore` to refresh it. */
    currentSession(): SignInSession | null;
    /** Creates and stores PKCE state, and returns the authorize URL. */
    startSignIn(options?: SignInStartOptions): Promise<SignInStart>;
    /** Starts sign-in and sends the browser to the authorization endpoint. */
    signIn(options?: SignInStartOptions): Promise<void>;
    /** Validates the redirect and exchanges its code. Pending state is single-use. */
    completeSignIn(callbackUrl: string): Promise<SignInCompletion>;
    /** Exchanges the stored refresh token. Concurrent calls share one request. */
    refreshSession(): Promise<SignInSession>;
    /**
     * Settles state on page load: completes a sign-in redirect when `url` is the
     * redirect URI, otherwise reads the stored session and refreshes it if expired.
     */
    restore(url?: string): Promise<SignInRestoreResult>;
    /**
     * Clears local sign-in state. When the provider has an end-session endpoint,
     * sends the browser there and returns its URL.
     */
    signOut(options?: SignOutOptions): SignOutResult;
    private initialState;
    private exchangeCallback;
    /** Opens settings after the sign-in it asked for; a refusal leaves the person on the app page. */
    private reopenAccountSettings;
    private exchangeRefreshToken;
    private requestTokens;
    private sessionFromTokenResponse;
    /** A redirect back to the app while this tab has a sign-in in progress. */
    private isPendingCallback;
    private takePending;
    private saveSession;
    private clearSession;
    private setState;
    private scopes;
    private storageKey;
}
