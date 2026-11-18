// Browser sign-in for app users: OAuth 2.0 authorization code with PKCE (RFC 7636).
//
// The app is a public client, so no client secret is involved. Pending sign-in
// state and the token set live in sessionStorage by default. Tokens are never
// placed in error messages.

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
};

export type SignInStart = {
  authorizationUrl: string;
};

export type SignInCompletion = {
  session: SignInSession;
  returnTo: string;
};

export type SignOutOptions = {
  postLogoutRedirectUri?: string;
};

export type SignOutResult = {
  endSessionUrl?: string;
};

export const SIGN_IN_STATUSES = {
  signedOut: "signed_out",
  signingIn: "signing_in",
  signedIn: "signed_in",
  error: "error",
} as const;

export type SignInStatus = (typeof SIGN_IN_STATUSES)[keyof typeof SIGN_IN_STATUSES];

export type SignInState =
  | { status: typeof SIGN_IN_STATUSES.signedOut }
  | { status: typeof SIGN_IN_STATUSES.signingIn }
  | { status: typeof SIGN_IN_STATUSES.signedIn; session: SignInSession }
  | { status: typeof SIGN_IN_STATUSES.error; error: SignInError };

export type SignInRestoreResult = {
  state: SignInState;
  /** Set when this page load completed a sign-in redirect. */
  returnTo?: string;
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
} as const;

export type SignInErrorCode = (typeof SIGN_IN_ERROR_CODES)[keyof typeof SIGN_IN_ERROR_CODES];

export class SignInError extends Error {
  constructor(
    readonly code: SignInErrorCode,
    message: string,
    /** OAuth `error` value from the authorization server, when it sent one. */
    readonly oauthError?: string,
    readonly status?: number,
  ) {
    super(`custd: ${message}`);
    this.name = "SignInError";
  }
}

export const DEFAULT_SIGN_IN_SCOPES: readonly string[] = ["openid", "profile", "offline_access"];

const STORAGE_PREFIX = "custd:sign-in";
const EXPIRY_SKEW_MS = 30_000;
const RANDOM_BYTES = 32;

type PendingSignIn = {
  state: string;
  codeVerifier: string;
  returnTo: string;
};

type TokenResponse = {
  access_token?: unknown;
  token_type?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
  id_token?: unknown;
  scope?: unknown;
  error?: unknown;
};

/** Reads and validates the sign-in endpoints from a discovery document. */
export function signInConfigFromDiscovery(
  document: CustdDiscoveryDocument,
  options: SignInDiscoveryOptions,
): BrowserSignInEndpoints {
  const signIn = document.signIn;
  if (!signIn) {
    throw new SignInError(SIGN_IN_ERROR_CODES.invalidDiscovery, "discovery document has no signIn section");
  }
  const config: BrowserSignInEndpoints = {
    issuer: signIn.issuer,
    authorizationEndpoint: signIn.authorizationEndpoint,
    tokenEndpoint: signIn.tokenEndpoint,
    clientId: signIn.clientId,
    redirectUri: options.redirectUri,
  };
  if (signIn.endSessionEndpoint) config.endSessionEndpoint = signIn.endSessionEndpoint;
  if (signIn.postLogoutRedirectUri) config.postLogoutRedirectUri = signIn.postLogoutRedirectUri;
  if (signIn.audience) config.audience = signIn.audience;
  if (options.scopes) config.scopes = options.scopes;
  validateEndpoints(config);
  return config;
}

/** RFC 7636 S256 challenge: base64url(SHA-256(verifier)) without padding. */
export async function createSignInCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return base64Url(new Uint8Array(digest));
}

export class BrowserSignIn {
  private readonly config: BrowserSignInEndpoints;
  private readonly storage: SignInStorage;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly navigate: (url: string) => void;
  private readonly listeners = new Set<() => void>();
  private state: SignInState;
  private completion: Promise<SignInCompletion> | null = null;
  private refresh: Promise<SignInSession> | null = null;

  constructor(config: BrowserSignInConfig) {
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
  getState(): SignInState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Stored session, or null. It may be expired; use `restore` to refresh it. */
  currentSession(): SignInSession | null {
    const stored = readJson(this.storage, this.storageKey("session"));
    return isSession(stored) ? stored : null;
  }

  /** Creates and stores PKCE state, and returns the authorize URL. */
  async startSignIn(options: SignInStartOptions = {}): Promise<SignInStart> {
    const pending: PendingSignIn = {
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
    if (this.config.audience) url.searchParams.set("audience", this.config.audience);
    return { authorizationUrl: url.toString() };
  }

  /** Starts sign-in and sends the browser to the authorization endpoint. */
  async signIn(options: SignInStartOptions = {}): Promise<void> {
    this.setState({ status: SIGN_IN_STATUSES.signingIn });
    try {
      const start = await this.startSignIn(options);
      this.navigate(start.authorizationUrl);
    } catch (error) {
      this.setState({ status: SIGN_IN_STATUSES.error, error: toSignInError(error) });
      throw error;
    }
  }

  /** Validates the redirect and exchanges its code. Pending state is single-use. */
  completeSignIn(callbackUrl: string): Promise<SignInCompletion> {
    this.completion ??= this.exchangeCallback(callbackUrl).finally(() => {
      this.completion = null;
    });
    return this.completion;
  }

  /** Exchanges the stored refresh token. Concurrent calls share one request. */
  refreshSession(): Promise<SignInSession> {
    this.refresh ??= this.exchangeRefreshToken().finally(() => {
      this.refresh = null;
    });
    return this.refresh;
  }

  /**
   * Settles state on page load: completes a sign-in redirect when `url` is the
   * redirect URI, otherwise reads the stored session and refreshes it if expired.
   */
  async restore(url: string = currentHref()): Promise<SignInRestoreResult> {
    if (this.isPendingCallback(url)) {
      this.setState({ status: SIGN_IN_STATUSES.signingIn });
      try {
        const completion = await this.completeSignIn(url);
        return { state: this.state, returnTo: completion.returnTo };
      } catch (error) {
        this.setState({ status: SIGN_IN_STATUSES.error, error: toSignInError(error) });
        return { state: this.state };
      }
    }
    const session = this.currentSession();
    if (session && session.expiresAtMs - EXPIRY_SKEW_MS <= this.now() && session.refreshToken) {
      try {
        await this.refreshSession();
      } catch (error) {
        this.storage.removeItem(this.storageKey("session"));
        this.setState({ status: SIGN_IN_STATUSES.error, error: toSignInError(error) });
      }
    } else if (!session || session.expiresAtMs <= this.now()) {
      this.clearSession();
    }
    return { state: this.state };
  }

  /**
   * Clears local sign-in state. When the provider has an end-session endpoint,
   * sends the browser there and returns its URL.
   */
  signOut(options: SignOutOptions = {}): SignOutResult {
    const idToken = this.currentSession()?.idToken;
    this.storage.removeItem(this.storageKey("pending"));
    this.clearSession();
    if (!this.config.endSessionEndpoint) return {};
    const url = new URL(this.config.endSessionEndpoint);
    url.searchParams.set("client_id", this.config.clientId);
    if (idToken) url.searchParams.set("id_token_hint", idToken);
    const postLogoutRedirectUri = options.postLogoutRedirectUri ?? this.config.postLogoutRedirectUri;
    if (postLogoutRedirectUri) url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    const endSessionUrl = url.toString();
    this.navigate(endSessionUrl);
    return { endSessionUrl };
  }

  private initialState(): SignInState {
    if (this.isPendingCallback(currentHref())) return { status: SIGN_IN_STATUSES.signingIn };
    const session = this.currentSession();
    return session ? { status: SIGN_IN_STATUSES.signedIn, session } : { status: SIGN_IN_STATUSES.signedOut };
  }

  private async exchangeCallback(callbackUrl: string): Promise<SignInCompletion> {
    const params = new URL(callbackUrl).searchParams;
    const pending = this.takePending();
    if (!pending) {
      throw new SignInError(SIGN_IN_ERROR_CODES.missingPendingSignIn, "no sign-in is in progress in this tab");
    }
    if (params.get("state") !== pending.state) {
      throw new SignInError(
        SIGN_IN_ERROR_CODES.stateMismatch,
        "sign-in state does not match; the redirect was refused",
      );
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
    if (!code) throw new SignInError(SIGN_IN_ERROR_CODES.missingCode, "sign-in redirect has no code");
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

  private async exchangeRefreshToken(): Promise<SignInSession> {
    const refreshToken = this.currentSession()?.refreshToken;
    if (!refreshToken) throw new SignInError(SIGN_IN_ERROR_CODES.noRefreshToken, "session has no refresh token");
    const session = await this.requestTokens(
      { grant_type: "refresh_token", refresh_token: refreshToken, client_id: this.config.clientId },
      refreshToken,
    );
    this.saveSession(session);
    return session;
  }

  private async requestTokens(form: Record<string, string>, previousRefreshToken?: string): Promise<SignInSession> {
    const response = await this.fetchImpl(this.config.tokenEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams(form).toString(),
    });
    const body = (await response.json().catch(() => ({}))) as TokenResponse;
    if (!response.ok) {
      const oauthError = typeof body.error === "string" ? body.error : undefined;
      throw new SignInError(
        SIGN_IN_ERROR_CODES.tokenRequestFailed,
        `token endpoint returned ${response.status}${oauthError ? ` (${oauthError})` : ""}`,
        oauthError,
        response.status,
      );
    }
    return this.sessionFromTokenResponse(body, previousRefreshToken);
  }

  private sessionFromTokenResponse(body: TokenResponse, previousRefreshToken?: string): SignInSession {
    if (
      typeof body.access_token !== "string" ||
      typeof body.token_type !== "string" ||
      typeof body.expires_in !== "number"
    ) {
      throw new SignInError(
        SIGN_IN_ERROR_CODES.invalidTokenResponse,
        "token response needs access_token, token_type and expires_in",
      );
    }
    const session: SignInSession = {
      accessToken: body.access_token,
      tokenType: body.token_type,
      expiresAtMs: this.now() + body.expires_in * 1000,
      scopes: typeof body.scope === "string" ? body.scope.split(" ").filter(Boolean) : this.scopes(),
    };
    const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token : previousRefreshToken;
    if (refreshToken) session.refreshToken = refreshToken;
    const idToken = typeof body.id_token === "string" ? body.id_token : this.currentSession()?.idToken;
    if (idToken) session.idToken = idToken;
    return session;
  }

  /** A redirect back to the app while this tab has a sign-in in progress. */
  private isPendingCallback(url: string): boolean {
    if (this.completion === null && this.storage.getItem(this.storageKey("pending")) === null) return false;
    const current = new URL(url);
    const redirect = new URL(this.config.redirectUri);
    return (
      current.origin === redirect.origin &&
      current.pathname === redirect.pathname &&
      (current.searchParams.has("code") || current.searchParams.has("error"))
    );
  }

  private takePending(): PendingSignIn | null {
    const key = this.storageKey("pending");
    const stored = readJson(this.storage, key);
    this.storage.removeItem(key);
    return isPending(stored) ? stored : null;
  }

  private saveSession(session: SignInSession): void {
    this.storage.setItem(this.storageKey("session"), JSON.stringify(session));
    this.setState({ status: SIGN_IN_STATUSES.signedIn, session });
  }

  private clearSession(): void {
    this.storage.removeItem(this.storageKey("session"));
    this.setState({ status: SIGN_IN_STATUSES.signedOut });
  }

  private setState(state: SignInState): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }

  private scopes(): string[] {
    return this.config.scopes ? [...this.config.scopes] : [...DEFAULT_SIGN_IN_SCOPES];
  }

  private storageKey(kind: "pending" | "session"): string {
    return `${STORAGE_PREFIX}:${this.config.clientId}:${kind}`;
  }
}

function validateEndpoints(config: BrowserSignInEndpoints): void {
  for (const field of ["issuer", "authorizationEndpoint", "tokenEndpoint", "clientId", "redirectUri"] as const) {
    if (typeof config[field] !== "string" || config[field] === "") {
      throw new SignInError(SIGN_IN_ERROR_CODES.invalidDiscovery, `sign-in ${field} is required`);
    }
  }
  for (const field of ["authorizationEndpoint", "tokenEndpoint", "redirectUri"] as const) {
    assertSecureOrLocalHTTP(config[field], field);
  }
  if (config.endSessionEndpoint) assertSecureOrLocalHTTP(config.endSessionEndpoint, "endSessionEndpoint");
  if (config.postLogoutRedirectUri) assertSecureOrLocalHTTP(config.postLogoutRedirectUri, "postLogoutRedirectUri");
}

function assertSecureOrLocalHTTP(rawUrl: string, field: string): void {
  const parsed = new URL(rawUrl);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local)) {
    throw new SignInError(
      SIGN_IN_ERROR_CODES.invalidDiscovery,
      `sign-in ${field} must use https unless it targets localhost`,
    );
  }
}

function randomToken(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(RANDOM_BYTES)));
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeReturnTo(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

function currentHref(): string {
  return typeof window === "undefined" ? "http://localhost/" : window.location.href;
}

function readJson(storage: SignInStorage, key: string): unknown {
  const raw = storage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function isPending(value: unknown): value is PendingSignIn {
  const record = value as Partial<PendingSignIn> | null;
  return (
    typeof record?.state === "string" && typeof record.codeVerifier === "string" && typeof record.returnTo === "string"
  );
}

function isSession(value: unknown): value is SignInSession {
  const record = value as Partial<SignInSession> | null;
  return (
    typeof record?.accessToken === "string" &&
    typeof record.tokenType === "string" &&
    typeof record.expiresAtMs === "number" &&
    Array.isArray(record.scopes)
  );
}

function toSignInError(error: unknown): SignInError {
  if (error instanceof SignInError) return error;
  return new SignInError(SIGN_IN_ERROR_CODES.tokenRequestFailed, "sign-in request failed");
}

function defaultStorage(): SignInStorage {
  if (typeof sessionStorage !== "undefined") return sessionStorage;
  const items = new Map<string, string>();
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
