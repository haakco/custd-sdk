import { describe, expect, it, vi } from "vitest";
import {
  BrowserSignIn,
  type BrowserSignInConfig,
  createSignInCodeChallenge,
  SIGN_IN_ERROR_CODES,
  SIGN_IN_STATUSES,
  SignInError,
  type SignInStorage,
  signInConfigFromDiscovery,
} from "./browser-sign-in";

const ISSUER = "https://auth.example.com/";
const REDIRECT_URI = "https://app.example.com/callback";

function memoryStorage(): SignInStorage & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
}

function tokenResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function setup(fetchImpl: BrowserSignInConfig["fetch"] = vi.fn()) {
  const storage = memoryStorage();
  const navigate = vi.fn();
  const signIn = new BrowserSignIn({
    issuer: ISSUER,
    authorizationEndpoint: "https://auth.example.com/oauth2/auth",
    tokenEndpoint: "https://auth.example.com/oauth2/token",
    endSessionEndpoint: "https://auth.example.com/oauth2/sessions/logout",
    clientId: "app-client",
    redirectUri: REDIRECT_URI,
    storage,
    fetch: fetchImpl,
    now: () => 1_000_000,
    navigate,
  });
  return { signIn, storage, navigate };
}

async function startAndCallback(signIn: BrowserSignIn): Promise<string> {
  const start = await signIn.startSignIn({ returnTo: "/items" });
  const state = new URL(start.authorizationUrl).searchParams.get("state");
  return `${REDIRECT_URI}?code=auth-code&state=${state}`;
}

describe("BrowserSignIn", () => {
  it("derives the RFC 7636 S256 challenge from the verifier", async () => {
    await expect(createSignInCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).resolves.toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("builds the authorize URL with an S256 challenge of the stored verifier", async () => {
    const { signIn, storage } = setup();
    const start = await signIn.startSignIn();
    const url = new URL(start.authorizationUrl);
    const pending = JSON.parse([...storage.items.values()][0] ?? "{}");

    expect(url.origin + url.pathname).toBe("https://auth.example.com/oauth2/auth");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("app-client");
    expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(url.searchParams.get("scope")).toBe("openid profile offline_access");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe(pending.state);
    expect(url.searchParams.get("code_challenge")).toBe(await createSignInCodeChallenge(pending.codeVerifier));
  });

  it("sends the audience on the authorize request only when one is configured", async () => {
    const withoutAudience = new URL((await setup().signIn.startSignIn()).authorizationUrl);
    expect(withoutAudience.searchParams.has("audience")).toBe(false);

    const signIn = new BrowserSignIn({
      issuer: ISSUER,
      authorizationEndpoint: "https://auth.example.com/oauth2/auth",
      tokenEndpoint: "https://auth.example.com/oauth2/token",
      clientId: "app-client",
      audience: "app-web",
      redirectUri: REDIRECT_URI,
      storage: memoryStorage(),
    });
    const withAudience = new URL((await signIn.startSignIn()).authorizationUrl);
    expect(withAudience.searchParams.get("audience")).toBe("app-web");
  });

  it("refuses a callback whose state does not match and clears the pending sign-in", async () => {
    const fetchMock = vi.fn();
    const { signIn, storage } = setup(fetchMock);
    await signIn.startSignIn();

    const error = await signIn.completeSignIn(`${REDIRECT_URI}?code=auth-code&state=forged`).catch((e) => e);

    expect(error).toBeInstanceOf(SignInError);
    expect(error.code).toBe(SIGN_IN_ERROR_CODES.stateMismatch);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storage.items.size).toBe(0);
  });

  it("exchanges the code for a token set and stores the session", async () => {
    const fetchMock = vi.fn(async () =>
      tokenResponse({
        access_token: "access-1",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "refresh-1",
        id_token: "id-1",
        scope: "openid profile offline_access",
      }),
    );
    const { signIn } = setup(fetchMock);
    const callback = await startAndCallback(signIn);

    const result = await signIn.completeSignIn(callback);

    expect(result.returnTo).toBe("/items");
    expect(result.session).toEqual({
      accessToken: "access-1",
      tokenType: "bearer",
      expiresAtMs: 1_000_000 + 3_600_000,
      refreshToken: "refresh-1",
      idToken: "id-1",
      scopes: ["openid", "profile", "offline_access"],
    });
    expect(signIn.currentSession()).toEqual(result.session);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = new URLSearchParams(String(init.body));
    expect(url).toBe("https://auth.example.com/oauth2/token");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("client_id")).toBe("app-client");
    expect(body.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(body.get("code_verifier")).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("refreshes the session and keeps the refresh token when none is rotated", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        tokenResponse({ access_token: "access-1", token_type: "bearer", expires_in: 60, refresh_token: "refresh-1" }),
      )
      .mockResolvedValueOnce(tokenResponse({ access_token: "access-2", token_type: "bearer", expires_in: 60 }));
    const { signIn } = setup(fetchMock);
    await signIn.completeSignIn(await startAndCallback(signIn));

    const refreshed = await signIn.refreshSession();

    expect(refreshed.accessToken).toBe("access-2");
    expect(refreshed.refreshToken).toBe("refresh-1");
    const body = new URLSearchParams(String((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body));
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-1");
    expect(signIn.currentSession()?.accessToken).toBe("access-2");
  });

  it("signs out by clearing storage and sending the browser to the end-session URL", async () => {
    const fetchMock = vi.fn(async () =>
      tokenResponse({ access_token: "access-1", token_type: "bearer", expires_in: 60, id_token: "id-1" }),
    );
    const { signIn, storage, navigate } = setup(fetchMock);
    await signIn.completeSignIn(await startAndCallback(signIn));
    await signIn.startSignIn();

    const result = signIn.signOut({ postLogoutRedirectUri: "https://app.example.com/" });

    expect(storage.items.size).toBe(0);
    expect(signIn.currentSession()).toBeNull();
    const url = new URL(result.endSessionUrl ?? "");
    expect(url.searchParams.get("id_token_hint")).toBe("id-1");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe("https://app.example.com/");
    expect(navigate).toHaveBeenCalledWith(result.endSessionUrl);
  });

  it("reports a failed token exchange without the response body", async () => {
    const fetchMock = vi.fn(async () => tokenResponse({ error: "invalid_grant", secret: "do-not-leak" }, 400));
    const { signIn } = setup(fetchMock);

    const error = await signIn.completeSignIn(await startAndCallback(signIn)).catch((e) => e);

    expect(error.code).toBe(SIGN_IN_ERROR_CODES.tokenRequestFailed);
    expect(error.oauthError).toBe("invalid_grant");
    expect(error.message).not.toContain("do-not-leak");
  });
});

describe("BrowserSignIn.restore", () => {
  it("completes a redirect once and notifies subscribers of signing-in then signed-in", async () => {
    const fetchMock = vi.fn(async () =>
      tokenResponse({ access_token: "access-1", token_type: "bearer", expires_in: 60 }),
    );
    const { signIn } = setup(fetchMock);
    const callback = await startAndCallback(signIn);
    const statuses: string[] = [];
    signIn.subscribe(() => statuses.push(signIn.getState().status));

    const [first, second] = await Promise.all([signIn.restore(callback), signIn.restore(callback)]);

    expect(first.returnTo).toBe("/items");
    expect(second.state.status).toBe(SIGN_IN_STATUSES.signedIn);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(statuses[0]).toBe(SIGN_IN_STATUSES.signingIn);
    expect(statuses[statuses.length - 1]).toBe(SIGN_IN_STATUSES.signedIn);
  });
});

describe("BrowserSignIn state", () => {
  it("publishes signing-in and navigates to the authorize URL", async () => {
    const { signIn, navigate } = setup();

    const started = signIn.signIn();
    expect(signIn.getState().status).toBe(SIGN_IN_STATUSES.signingIn);
    await started;

    expect(String(navigate.mock.calls[0]?.[0])).toMatch(/^https:\/\/auth\.example\.com\/oauth2\/auth\?/);
  });

  it("ends in an error state when a redirect carries a forged state", async () => {
    const { signIn } = setup();
    await signIn.startSignIn();

    const result = await signIn.restore(`${REDIRECT_URI}?code=auth-code&state=forged`);

    expect(result.state.status).toBe(SIGN_IN_STATUSES.error);
    expect(result.state.status === SIGN_IN_STATUSES.error && result.state.error.code).toBe(
      SIGN_IN_ERROR_CODES.stateMismatch,
    );
  });

  it("refreshes an expired session on restore and drops it when refresh fails", async () => {
    const expired = JSON.stringify({
      accessToken: "old",
      tokenType: "bearer",
      expiresAtMs: 1,
      refreshToken: "refresh-1",
      scopes: ["openid"],
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse({ access_token: "access-2", token_type: "bearer", expires_in: 60 }))
      .mockResolvedValueOnce(tokenResponse({ error: "invalid_grant" }, 400));
    const { signIn, storage } = setup(fetchMock);
    storage.setItem("custd:sign-in:app-client:session", expired);

    expect((await signIn.restore("https://app.example.com/")).state.status).toBe(SIGN_IN_STATUSES.signedIn);
    storage.setItem("custd:sign-in:app-client:session", expired);
    const failed = await signIn.restore("https://app.example.com/");

    expect(failed.state.status).toBe(SIGN_IN_STATUSES.error);
    expect(signIn.currentSession()).toBeNull();
  });
});

describe("signInConfigFromDiscovery", () => {
  it("reads the sign-in endpoints from the discovery document", () => {
    const config = signInConfigFromDiscovery(
      {
        signIn: {
          issuer: ISSUER,
          authorizationEndpoint: "https://auth.example.com/oauth2/auth",
          tokenEndpoint: "https://auth.example.com/oauth2/token",
          endSessionEndpoint: "https://auth.example.com/oauth2/sessions/logout",
          clientId: "app-client",
          audience: "app-web",
        },
      },
      { redirectUri: REDIRECT_URI },
    );

    expect(config).toEqual({
      issuer: ISSUER,
      authorizationEndpoint: "https://auth.example.com/oauth2/auth",
      tokenEndpoint: "https://auth.example.com/oauth2/token",
      endSessionEndpoint: "https://auth.example.com/oauth2/sessions/logout",
      clientId: "app-client",
      audience: "app-web",
      redirectUri: REDIRECT_URI,
    });
  });

  it("refuses a discovery document without sign-in or with an insecure endpoint", () => {
    expect(() => signInConfigFromDiscovery({}, { redirectUri: REDIRECT_URI })).toThrow(SignInError);
    expect(() =>
      signInConfigFromDiscovery(
        {
          signIn: {
            issuer: ISSUER,
            authorizationEndpoint: "http://auth.example.com/oauth2/auth",
            tokenEndpoint: "https://auth.example.com/oauth2/token",
            clientId: "app-client",
          },
        },
        { redirectUri: REDIRECT_URI },
      ),
    ).toThrow(/https/);
  });
});
