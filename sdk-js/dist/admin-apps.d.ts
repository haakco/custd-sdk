/**
 * Apps: a hosted application served at `<slug>.<apps domain>`, made of an auth
 * project whose production environment is hosted. An app is addressed by its
 * slug, which comes from its name; one the caller cannot see answers
 * `app_not_found`, exactly like one that does not exist. Releases are deployed
 * through the environment's release routes. The operations live on
 * `admin.authProjects`.
 */
import type { AppReleaseSummary } from "./admin-app-releases.js";
/** An app's one status. A list shows the worst first. */
export declare const APP_STATUSES: {
    readonly needsAttention: "needs_attention";
    readonly removalUnfinished: "removal_unfinished";
    readonly live: "live";
    readonly notDeployed: "not_deployed";
    readonly paused: "paused";
    readonly offboarded: "offboarded";
};
export type AppStatus = (typeof APP_STATUSES)[keyof typeof APP_STATUSES];
/** Why an app needs attention. The set is closed. */
export declare const APP_REASON_CODES: {
    readonly siteRegistrationIncomplete: "site_registration_incomplete";
    readonly signInNotReady: "sign_in_not_ready";
};
export type AppReasonCode = (typeof APP_REASON_CODES)[keyof typeof APP_REASON_CODES];
/** Problem codes the app routes answer with. */
export declare const APP_ERROR_CODES: {
    readonly notFound: "app_not_found";
    readonly nameTaken: "app_name_taken";
    readonly nameInvalid: "app_name_invalid";
    /** Repeat the same body and Idempotency-Key to finish the create. */
    readonly setupIncomplete: "app_setup_incomplete";
};
/** Whether a created app's traffic reports are published. */
export type AppTrafficReporting = "ready" | "unavailable";
/** A new app: its name, from which the address is derived, and whether people sign in (invite-only). */
export type AppCreateRequest = {
    name: string;
    signIn?: boolean;
};
export type AppReason = {
    code: AppReasonCode;
    message: string;
};
/** One app as the list shows it. */
export type AppSummary = {
    appId: string;
    slug: string;
    name: string;
    environmentId: string;
    host: string;
    url: string;
    siteUuid?: string;
    status: AppStatus;
    reason?: AppReason;
    signIn: boolean;
    activeReleaseId?: string;
    servingSince?: string;
};
/** The receipt for one create. `replayed` is true when the same Idempotency-Key had already created it. */
export type AppCreation = {
    app: AppSummary;
    replayed: boolean;
    trafficReporting: AppTrafficReporting;
};
/** One page of the caller's apps, worst status first. Pass `nextAfter` as the next call's `after`. */
export type AppListResponse = {
    apps: AppSummary[] | null;
    nextAfter?: string;
};
/** One app with its latest release, how many releases it keeps and its live owner and share links. */
export type AppOverview = {
    app: AppSummary;
    latestRelease?: AppReleaseSummary;
    releaseCount: number;
    ownerLinks: number;
    shareLinks: number;
};
/**
 * A CI credential holding `apps.releases.write` that reaches only this app's release routes and
 * its read. The secret is in this response only: hand it to the caller's secret store.
 */
export type AppDeployCredential = {
    clientId: string;
    clientSecret: string;
    app: string;
    scope: string;
};
export declare function appPath(slug: string): string;
