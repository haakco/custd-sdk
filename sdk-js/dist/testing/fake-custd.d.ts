import { AppItemsClient } from "../app-items.js";
import type { BrowserSignIn, SignInSession, SignInStorage } from "../browser-sign-in.js";
import type { CaptureExceptionRequest } from "../error-capture.js";
import { type HostedAppCapability, type HostedAppDiscovery, type HostedAppOptions } from "../hosted-app.js";
export declare const FAKE_CUSTD_ORIGIN = "https://app.custd.test";
export declare const FAKE_CUSTD_SITE_KEY = "site_pk_fake";
export declare const FAKE_CUSTD_API_PATH = "/__custd";
export declare const FAKE_CUSTD_AUTH_PATH = "/__auth";
/** A request as a browser route interceptor sees it. Header names may use any case. */
export type FakeCustdRequest = {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
};
export type FakeCustdResponse = {
    status: number;
    headers: Record<string, string>;
    body?: string;
};
/** One answered request, with lowercase header names and the parsed JSON body when there is one. */
export type FakeCustdRecordedRequest = FakeCustdRequest & {
    path: string;
    json?: unknown;
};
/** One event the hosted app's tracker was handed. */
export type FakeTrackedEvent = {
    eventTypeSlug: string;
    payload?: Record<string, unknown>;
};
/** One error the hosted app's error capture was handed; the error itself is reduced to its type, as Custd would. */
export type FakeCapturedError = {
    exceptionType: string;
    mode?: CaptureExceptionRequest["mode"];
    correlationId?: string;
};
export type FakeCustdOptions = {
    /** The app's origin; the API is served under `/__custd` on it. Defaults to `https://app.custd.test`. */
    origin?: string;
    siteKey?: string;
    /** The sign-in public client's id. */
    clientId?: string;
    /** Defaults to every capability: tracking and error capture are recorded, never sent. */
    capabilities?: HostedAppCapability[];
    /** The clock every timestamp and estimate age uses. Defaults to `Date.now`. */
    now?: () => number;
    /** False makes alert email subscriptions refuse with `app_alert_no_verified_email`. */
    signedInUsersHaveVerifiedEmail?: boolean;
};
/** Sign-in storage held in memory, for tests that have no `sessionStorage`. */
export declare function memorySignInStorage(): SignInStorage;
/** Signs `user` in through the real PKCE flow of `signIn`, against the fake's authorize and token endpoints. */
export declare function signInWithFake(fake: FakeCustd, signIn: BrowserSignIn, user?: string): Promise<SignInSession>;
export declare class FakeCustd {
    readonly origin: string;
    readonly apiBaseUrl: string;
    readonly siteKey: string;
    /** Every request the fake answered, oldest first. */
    readonly requests: FakeCustdRecordedRequest[];
    /** Every event the hosted app tracked, oldest first. Page views appear as `page-view`. */
    readonly trackedEvents: FakeTrackedEvent[];
    /** Every error the hosted app captured, oldest first. */
    readonly capturedErrors: FakeCapturedError[];
    private readonly clientId;
    private readonly capabilities;
    private readonly now;
    private readonly verifiedEmail;
    private readonly items;
    private readonly links;
    private readonly codes;
    private readonly routes;
    private sequence;
    private userCount;
    constructor(options?: FakeCustdOptions);
    discovery(): HostedAppDiscovery;
    /** Options for `startHostedApp` (or `CustdHostedAppProvider`) that reach this fake. */
    hostedAppOptions(): HostedAppOptions;
    private recordingTracker;
    private recordingErrorCapture;
    /** A client that reaches this fake; `userToken` is the signed-in user, as the fake names them. */
    appItemsClient(options?: {
        userToken?: string;
    }): AppItemsClient;
    /** Approves a sign-in as `user` (a new user when absent) and returns the redirect back to the app. */
    authorize(authorizationUrl: string, user?: string): string;
    /** The fake as a `fetch`, for the SDK's clients. */
    readonly fetch: typeof fetch;
    /** Answers one request, as a browser route interceptor hands it over. */
    handle(raw: FakeCustdRequest): FakeCustdResponse;
    private dispatch;
    private auth;
    private itemRoutes;
    private resultRoutes;
    private alertRoutes;
    private routeWithId;
    private remove;
    private conditional;
    private caller;
    private linkCaller;
    private owned;
    private touch;
    private change;
    private nextSequence;
    private uuid;
    /** 43 base64url characters, the shape of a real link token. */
    private token;
    private nowIso;
    private create;
    private newItem;
    private issueLinks;
    private newModel;
    private newProject;
    private issue;
    private rotate;
    private revoke;
    private linkOf;
    private itemRead;
    private read;
    private ownership;
    private linksOf;
    private mine;
    private claim;
    private projectOf;
    private meetingOf;
    private settings;
    private complete;
    private setStatus;
    private measure;
    private estimate;
    private addEntry;
    private advance;
    private runForecast;
    private latestForecast;
    private forecastRun;
    private story;
    private saveVersion;
    private modelVersion;
    private copyModel;
    private runModel;
    private calculate;
    private latestModelRun;
    private alertSettings;
    private addRule;
    private addWebhook;
    private addSlack;
    private subscribe;
    private conditionMet;
    private evaluateAlerts;
    private deliver;
}
