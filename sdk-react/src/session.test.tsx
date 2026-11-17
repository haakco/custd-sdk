import { BrowserSignIn, SIGN_IN_STATUSES, type SignInStorage } from "@haakco/custd-sdk";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustdSessionProvider, useCustdSession } from "./session.js";

function storageWith(entries: Record<string, string>): SignInStorage {
  const items = new Map(Object.entries(entries));
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

function client(storage: SignInStorage): BrowserSignIn {
  return new BrowserSignIn({
    issuer: "https://auth.example.com/",
    authorizationEndpoint: "https://auth.example.com/oauth2/auth",
    tokenEndpoint: "https://auth.example.com/oauth2/token",
    clientId: "app-client",
    redirectUri: "https://app.example.com/callback",
    storage,
    navigate: () => undefined,
  });
}

function SessionStatus() {
  const session = useCustdSession();
  return (
    <p data-status={session.status}>
      {session.status === SIGN_IN_STATUSES.signedIn ? session.session?.scopes.join(",") : ""}
    </p>
  );
}

describe("useCustdSession", () => {
  it("renders the client's stored session as signed in", () => {
    const stored = JSON.stringify({ accessToken: "a", tokenType: "bearer", expiresAtMs: 9e15, scopes: ["openid"] });
    const html = renderToStaticMarkup(
      <CustdSessionProvider client={client(storageWith({ "custd:sign-in:app-client:session": stored }))}>
        <SessionStatus />
      </CustdSessionProvider>,
    );

    expect(html).toBe('<p data-status="signed_in">openid</p>');
  });

  it("renders signed out without a stored session", () => {
    const html = renderToStaticMarkup(
      <CustdSessionProvider client={client(storageWith({}))}>
        <SessionStatus />
      </CustdSessionProvider>,
    );

    expect(html).toBe('<p data-status="signed_out"></p>');
  });

  it("refuses use outside the provider", () => {
    expect(() => renderToStaticMarkup(<SessionStatus />)).toThrow(/CustdSessionProvider/);
  });
});
