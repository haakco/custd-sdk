/**
 * Apps: a hosted application served at `<slug>.<apps domain>`, made of an auth
 * project whose production environment is hosted. An app is addressed by its
 * slug, which comes from its name; one the caller cannot see answers
 * `app_not_found`, exactly like one that does not exist. Releases are deployed
 * through the environment's release routes. The operations live on
 * `admin.authProjects`.
 */
/** An app's one status. A list shows the worst first. */
export const APP_STATUSES = {
    needsAttention: "needs_attention",
    removalUnfinished: "removal_unfinished",
    live: "live",
    notDeployed: "not_deployed",
    paused: "paused",
    offboarded: "offboarded",
};
/** Why an app needs attention. The set is closed. */
export const APP_REASON_CODES = {
    siteRegistrationIncomplete: "site_registration_incomplete",
    signInNotReady: "sign_in_not_ready",
};
/** Problem codes the app routes answer with. */
export const APP_ERROR_CODES = {
    notFound: "app_not_found",
    nameTaken: "app_name_taken",
    nameInvalid: "app_name_invalid",
    /** Repeat the same body and Idempotency-Key to finish the create. */
    setupIncomplete: "app_setup_incomplete",
    /** Repeat the same pause or resume with the same Idempotency-Key to finish it. */
    hostingIncomplete: "app_hosting_incomplete",
    /** Repeat the same repair with the same Idempotency-Key to finish it. */
    repairIncomplete: "app_repair_incomplete",
    signInModeInvalid: "app_sign_in_mode_invalid",
    /** Resume the app before changing its sign-in. */
    signInHostingOff: "app_sign_in_hosting_off",
    signInApplyPending: "app_sign_in_apply_pending",
};
/** Who may sign in to an app. */
export const APP_SIGN_IN_MODES = {
    off: "off",
    inviteOnly: "invite_only",
    open: "open",
};
export function appPath(slug) {
    return `/apps/${encodeURIComponent(slug)}`;
}
