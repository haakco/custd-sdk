// Zero-config start for an app Custd hosts: read the app's own discovery file and
// start tracking, error capture and sign-in as the file enables them. Starting
// never throws; every failure comes back as a typed state the app can show.

import {
  BrowserSignIn,
  type CustdDiscoveryDocument,
  type CustdDiscoverySignIn,
  type SignInStorage,
  signInConfigFromDiscovery,
} from "./browser-sign-in.js";
import {
  type BrowserTracker,
  type BrowserTrackerConfig,
  createBrowserTracker,
  defaultSiteBatchSize,
  defaultSiteConsent,
  fetchBrowserSiteConfig,
} from "./browser-tracker.js";
import { ErrorCaptureClient, installBrowserErrorCapture } from "./error-capture.js";

export const HOSTED_APP_DISCOVERY_PATH = "/.well-known/custd.json";

export const HOSTED_APP_CAPABILITIES = {
  tracking: "tracking",
  errorCapture: "error_capture",
  appData: "app_data",
  signIn: "sign_in",
} as const;

export type HostedAppCapability = (typeof HOSTED_APP_CAPABILITIES)[keyof typeof HOSTED_APP_CAPABILITIES];

/** The hosted environment's sign-in block: its own directory's OAuth public client. */
export type HostedAppDiscoverySignIn = CustdDiscoverySignIn & {
  audience: string;
  redirectUri: string;
};

/** `/.well-known/custd.json` as Custd serves it for a hosted environment. */
export type HostedAppDiscovery = CustdDiscoveryDocument & {
  apiBaseUrl: string;
  host: string;
  siteUuid: string;
  /** The Site's public browser write key (`site_pk_...`). */
  browserKey: string;
  environment: string;
  /** Capabilities this SDK knows; unknown values from a newer backend are dropped. */
  capabilities: HostedAppCapability[];
  signIn?: HostedAppDiscoverySignIn;
};

export const HOSTED_APP_ERROR_CODES = {
  discoveryUnavailable: "discovery_unavailable",
  invalidDiscovery: "invalid_discovery",
  siteConfigUnavailable: "site_config_unavailable",
  capabilityFailed: "capability_failed",
} as const;

export type HostedAppErrorCode = (typeof HOSTED_APP_ERROR_CODES)[keyof typeof HOSTED_APP_ERROR_CODES];

export class HostedAppError extends Error {
  constructor(
    readonly code: HostedAppErrorCode,
    message: string,
    /** The capability that failed to start; absent when discovery itself failed. */
    readonly capability?: HostedAppCapability,
    readonly status?: number,
  ) {
    super(`custd: ${message}`);
    this.name = "HostedAppError";
  }
}

/** Typed event properties: flat scalar values, as registered event schemas declare them. */
export type AppEventProperties = Record<string, string | number | boolean | null>;

/** Maps each registered app event type slug to its properties. Declare it with `type`, not `interface`. */
export type AppEventMap = Record<string, AppEventProperties>;

export const APP_EVENT_OUTCOMES = {
  /** Handed to the tracker, which still applies consent and Do Not Track. */
  tracked: "tracked",
  /** Tracking is not enabled or did not start; nothing was sent. */
  trackingOff: "tracking_off",
  /** The collector or network refused the event. */
  failed: "failed",
} as const;

export type AppEventOutcome = (typeof APP_EVENT_OUTCOMES)[keyof typeof APP_EVENT_OUTCOMES];

export type HostedApp<TEvents extends AppEventMap = AppEventMap> = {
  discovery: HostedAppDiscovery;
  tracker?: BrowserTracker;
  errorCapture?: ErrorCaptureClient;
  /** Present when sign-in is enabled. Call `restore()` on page load (the React provider does). */
  signIn?: BrowserSignIn;
  /** Capabilities the discovery file enabled that could not start. The app keeps working. */
  problems: HostedAppError[];
  /** Sends a typed app event through the tracker. Never rejects. */
  trackAppEvent: <TName extends keyof TEvents & string>(
    name: TName,
    properties: TEvents[TName],
  ) => Promise<AppEventOutcome>;
  /** Stops tracking and error capture. Safe to call more than once. */
  stop: () => void;
};

export const HOSTED_APP_STATUSES = {
  ready: "ready",
  error: "error",
} as const;

export type HostedAppStart<TEvents extends AppEventMap = AppEventMap> =
  | { status: typeof HOSTED_APP_STATUSES.ready; app: HostedApp<TEvents> }
  | { status: typeof HOSTED_APP_STATUSES.error; error: HostedAppError };

export type HostedAppOptions = {
  /** Defaults to `/.well-known/custd.json` on the page's own origin. */
  discoveryUrl?: string;
  /** Used for discovery, site config, error capture and sign-in; the tracker uses the global fetch. */
  fetch?: typeof fetch;
  /** Release reported with captured errors, such as the build's commit. */
  release?: string;
  /** Overrides the consent default the Site's identity mode sets. */
  consent?: BrowserTrackerConfig["consent"];
  pageContext?: BrowserTrackerConfig["pageContext"];
  signInScopes?: string[];
  signInStorage?: SignInStorage;
};

/** Reads the hosted app's discovery file and starts what it enables. Never rejects. */
export async function startHostedApp<TEvents extends AppEventMap = AppEventMap>(
  options: HostedAppOptions = {},
): Promise<HostedAppStart<TEvents>> {
  const fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  let discovery: HostedAppDiscovery;
  try {
    discovery = await fetchHostedAppDiscovery(options.discoveryUrl ?? defaultDiscoveryUrl(), fetchImpl);
  } catch (error) {
    return { status: HOSTED_APP_STATUSES.error, error: toHostedAppError(error) };
  }
  const problems: HostedAppError[] = [];
  const enabled = new Set(discovery.capabilities);
  const errorCapture = enabled.has(HOSTED_APP_CAPABILITIES.errorCapture)
    ? attempt(problems, HOSTED_APP_CAPABILITIES.errorCapture, () => startErrorCapture(discovery, options, fetchImpl))
    : undefined;
  const signIn = enabled.has(HOSTED_APP_CAPABILITIES.signIn)
    ? attempt(problems, HOSTED_APP_CAPABILITIES.signIn, () => createSignIn(discovery, options, fetchImpl))
    : undefined;
  const tracker = enabled.has(HOSTED_APP_CAPABILITIES.tracking)
    ? await startTracking(discovery, options, fetchImpl).catch((error: unknown) => {
        problems.push(toCapabilityError(error, HOSTED_APP_CAPABILITIES.tracking));
        return undefined;
      })
    : undefined;
  return {
    status: HOSTED_APP_STATUSES.ready,
    app: hostedApp<TEvents>({ discovery, tracker, errorCapture, signIn, problems }),
  };
}

type StartedPieces = {
  discovery: HostedAppDiscovery;
  tracker?: BrowserTracker;
  errorCapture?: { client: ErrorCaptureClient; uninstall: () => void };
  signIn?: BrowserSignIn;
  problems: HostedAppError[];
};

function hostedApp<TEvents extends AppEventMap>(pieces: StartedPieces): HostedApp<TEvents> {
  const { tracker, errorCapture } = pieces;
  let stopped = false;
  return {
    discovery: pieces.discovery,
    tracker,
    errorCapture: errorCapture?.client,
    signIn: pieces.signIn,
    problems: pieces.problems,
    trackAppEvent: async (name, properties) => {
      if (!tracker || stopped) return APP_EVENT_OUTCOMES.trackingOff;
      try {
        await tracker.track(name, { ...properties });
        return APP_EVENT_OUTCOMES.tracked;
      } catch {
        return APP_EVENT_OUTCOMES.failed;
      }
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      tracker?.close();
      errorCapture?.uninstall();
    },
  };
}

async function fetchHostedAppDiscovery(url: string, fetchImpl: typeof fetch): Promise<HostedAppDiscovery> {
  let response: Response;
  try {
    response = await fetchImpl(url, { credentials: "omit", headers: { accept: "application/json" } });
  } catch {
    throw new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "discovery file could not be fetched");
  }
  if (!response.ok) {
    throw new HostedAppError(
      HOSTED_APP_ERROR_CODES.discoveryUnavailable,
      `discovery file returned ${response.status}`,
      undefined,
      response.status,
    );
  }
  const body: unknown = await response.json().catch(() => null);
  return parseHostedAppDiscovery(body);
}

/** Validates a discovery document from the wire. Throws `HostedAppError` when it is unusable. */
function parseHostedAppDiscovery(body: unknown): HostedAppDiscovery {
  if (!isRecord(body)) throw invalidDiscovery("discovery file is not a JSON object");
  const fields = ["apiBaseUrl", "host", "siteUuid", "browserKey", "environment"] as const;
  for (const field of fields) {
    if (!nonEmptyString(body[field])) throw invalidDiscovery(`discovery file needs ${field}`);
  }
  if (!Array.isArray(body.capabilities)) throw invalidDiscovery("discovery file needs capabilities");
  const known = new Set<unknown>(Object.values(HOSTED_APP_CAPABILITIES));
  const discovery: HostedAppDiscovery = {
    apiBaseUrl: body.apiBaseUrl as string,
    host: body.host as string,
    siteUuid: body.siteUuid as string,
    browserKey: body.browserKey as string,
    environment: body.environment as string,
    capabilities: body.capabilities.filter((value): value is HostedAppCapability => known.has(value)),
  };
  const signIn = parseSignIn(body.signIn);
  if (signIn) discovery.signIn = signIn;
  return discovery;
}

function parseSignIn(value: unknown): HostedAppDiscoverySignIn | undefined {
  if (!isRecord(value)) return undefined;
  const fields = ["issuer", "authorizationEndpoint", "tokenEndpoint", "clientId", "audience", "redirectUri"] as const;
  if (!fields.every((field) => nonEmptyString(value[field]))) return undefined;
  const signIn: HostedAppDiscoverySignIn = {
    issuer: value.issuer as string,
    authorizationEndpoint: value.authorizationEndpoint as string,
    tokenEndpoint: value.tokenEndpoint as string,
    clientId: value.clientId as string,
    audience: value.audience as string,
    redirectUri: value.redirectUri as string,
  };
  if (nonEmptyString(value.endSessionEndpoint)) signIn.endSessionEndpoint = value.endSessionEndpoint;
  return signIn;
}

async function startTracking(
  discovery: HostedAppDiscovery,
  options: HostedAppOptions,
  fetchImpl: typeof fetch,
): Promise<BrowserTracker> {
  const siteConfig = await fetchBrowserSiteConfig(discovery.apiBaseUrl, discovery.siteUuid, fetchImpl).catch(() => {
    throw new HostedAppError(
      HOSTED_APP_ERROR_CODES.siteConfigUnavailable,
      "site config could not be read",
      HOSTED_APP_CAPABILITIES.tracking,
    );
  });
  const tracker = createBrowserTracker({
    baseUrl: discovery.apiBaseUrl,
    siteUuid: discovery.siteUuid,
    writeKey: discovery.browserKey,
    environment: discovery.environment,
    identityMode: siteConfig.identityMode,
    allowedOrigins: siteConfig.allowedOrigins,
    batchSize: defaultSiteBatchSize(siteConfig),
    consent: options.consent ?? defaultSiteConsent(siteConfig),
    pageContext: options.pageContext,
  });
  tracker.installSpaTracking();
  return tracker;
}

function startErrorCapture(
  discovery: HostedAppDiscovery,
  options: HostedAppOptions,
  fetchImpl: typeof fetch,
): { client: ErrorCaptureClient; uninstall: () => void } {
  const client = new ErrorCaptureClient({
    baseUrl: discovery.apiBaseUrl,
    writeKey: discovery.browserKey,
    environment: discovery.environment,
    release: options.release,
    fetch: fetchImpl,
  });
  return { client, uninstall: installBrowserErrorCapture(client) };
}

function createSignIn(discovery: HostedAppDiscovery, options: HostedAppOptions, fetchImpl: typeof fetch) {
  const endpoints = signInConfigFromDiscovery(discovery, {
    redirectUri: discovery.signIn?.redirectUri ?? "",
    scopes: options.signInScopes,
  });
  return new BrowserSignIn({ ...endpoints, fetch: fetchImpl, storage: options.signInStorage });
}

function attempt<T>(problems: HostedAppError[], capability: HostedAppCapability, start: () => T): T | undefined {
  try {
    return start();
  } catch (error) {
    problems.push(toCapabilityError(error, capability));
    return undefined;
  }
}

function toCapabilityError(error: unknown, capability: HostedAppCapability): HostedAppError {
  if (error instanceof HostedAppError) return error;
  return new HostedAppError(HOSTED_APP_ERROR_CODES.capabilityFailed, `${capability} could not start`, capability);
}

function toHostedAppError(error: unknown): HostedAppError {
  if (error instanceof HostedAppError) return error;
  return new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "discovery file could not be read");
}

function defaultDiscoveryUrl(): string {
  if (typeof window === "undefined") {
    throw new HostedAppError(HOSTED_APP_ERROR_CODES.discoveryUnavailable, "no page origin to read discovery from");
  }
  return new URL(HOSTED_APP_DISCOVERY_PATH, window.location.origin).toString();
}

function invalidDiscovery(message: string): HostedAppError {
  return new HostedAppError(HOSTED_APP_ERROR_CODES.invalidDiscovery, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}
