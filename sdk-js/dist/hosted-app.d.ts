import { AppItemsClient } from "./app-items.js";
import type { AppWebSocketFactory } from "./app-push.js";
import { BrowserSignIn, type CustdDiscoveryDocument, type CustdDiscoverySignIn, type SignInStorage } from "./browser-sign-in.js";
import { type BrowserIdentityMode, type BrowserTracker, type BrowserTrackerConfig } from "./browser-tracker.js";
import { ErrorCaptureClient, type ErrorCaptureConfig } from "./error-capture.js";
export declare const HOSTED_APP_DISCOVERY_PATH = "/.well-known/custd.json";
export declare const HOSTED_APP_CAPABILITIES: {
    readonly tracking: "tracking";
    readonly errorCapture: "error_capture";
    readonly appData: "app_data";
    readonly signIn: "sign_in";
};
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
    /** The Site's public config; when both are present the tracker starts without fetching it. */
    identityMode?: BrowserIdentityMode;
    allowedOrigins?: string[];
    pageViewSchemaVersion?: string;
};
export declare const HOSTED_APP_ERROR_CODES: {
    readonly discoveryUnavailable: "discovery_unavailable";
    readonly invalidDiscovery: "invalid_discovery";
    readonly siteConfigUnavailable: "site_config_unavailable";
    readonly capabilityFailed: "capability_failed";
};
export type HostedAppErrorCode = (typeof HOSTED_APP_ERROR_CODES)[keyof typeof HOSTED_APP_ERROR_CODES];
export declare class HostedAppError extends Error {
    readonly code: HostedAppErrorCode;
    readonly capability?: HostedAppCapability | undefined;
    readonly status?: number | undefined;
    /** @param capability The capability that failed to start; absent when discovery itself failed. */
    constructor(code: HostedAppErrorCode, message: string, capability?: HostedAppCapability | undefined, status?: number | undefined);
}
/** Typed event properties: flat scalar values, as registered event schemas declare them. */
export type AppEventProperties = Record<string, string | number | boolean | null>;
/** Maps each registered app event type slug to its properties. Declare it with `type`, not `interface`. */
export type AppEventMap = Record<string, AppEventProperties>;
export declare const APP_EVENT_OUTCOMES: {
    /** Handed to the tracker, which still applies consent and Do Not Track. */
    readonly tracked: "tracked";
    /** Tracking is not enabled or did not start; nothing was sent. */
    readonly trackingOff: "tracking_off";
    /** The collector or network refused the event. */
    readonly failed: "failed";
};
export type AppEventOutcome = (typeof APP_EVENT_OUTCOMES)[keyof typeof APP_EVENT_OUTCOMES];
/** What a hosted app's error capture offers: report one error. Always resolves. */
export type HostedAppErrorCapture = Pick<ErrorCaptureClient, "captureException">;
/** Started error capture and how to remove the page handlers it installed. */
export type HostedAppErrorCaptureStart = {
    client: HostedAppErrorCapture;
    uninstall: () => void;
};
export type HostedApp<TEvents extends AppEventMap = AppEventMap> = {
    discovery: HostedAppDiscovery;
    tracker?: BrowserTracker;
    errorCapture?: HostedAppErrorCapture;
    /** Present when sign-in is enabled. Call `restore()` on page load (the React provider does). */
    signIn?: BrowserSignIn;
    /** Present when app data is enabled: create, read and change the app's items. */
    appItems?: AppItemsClient;
    /** Capabilities the discovery file enabled that could not start. The app keeps working. */
    problems: HostedAppError[];
    /** Sends a typed app event through the tracker. Never rejects. */
    trackAppEvent: <TName extends keyof TEvents & string>(name: TName, properties: TEvents[TName]) => Promise<AppEventOutcome>;
    /** Stops tracking and error capture. Safe to call more than once. */
    stop: () => void;
};
export declare const HOSTED_APP_STATUSES: {
    readonly ready: "ready";
    readonly error: "error";
};
export type HostedAppStart<TEvents extends AppEventMap = AppEventMap> = {
    status: typeof HOSTED_APP_STATUSES.ready;
    app: HostedApp<TEvents>;
} | {
    status: typeof HOSTED_APP_STATUSES.error;
    error: HostedAppError;
};
export type HostedAppOptions = {
    /** Defaults to `/.well-known/custd.json` on the page's own origin. */
    discoveryUrl?: string;
    /** Used for discovery, site config, error capture and sign-in; the tracker uses the global fetch. */
    fetch?: typeof fetch;
    /** Opens the realtime socket for watched app reads; see `AppItemsClientConfig.webSocket`. */
    webSocket?: AppWebSocketFactory | null;
    /** Release reported with captured errors, such as the build's commit. */
    release?: string;
    /** Overrides the consent default the Site's identity mode sets. */
    consent?: BrowserTrackerConfig["consent"];
    pageContext?: BrowserTrackerConfig["pageContext"];
    signInScopes?: string[];
    signInStorage?: SignInStorage;
    /** Builds the tracker; defaults to the browser tracker. `@haakco/custd-sdk/testing` records instead. */
    createTracker?: (config: BrowserTrackerConfig) => BrowserTracker;
    /** Starts error capture; defaults to the page's error handlers. `@haakco/custd-sdk/testing` records instead. */
    startErrorCapture?: (config: ErrorCaptureConfig) => HostedAppErrorCaptureStart;
};
/** Reads the hosted app's discovery file and starts what it enables. Never rejects. */
export declare function startHostedApp<TEvents extends AppEventMap = AppEventMap>(options?: HostedAppOptions): Promise<HostedAppStart<TEvents>>;
