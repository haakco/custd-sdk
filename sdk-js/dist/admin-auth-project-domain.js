// Types for an auth-project environment's authentication domain, its realm brand logo and its
// app item links. The operations live on `admin.authProjects`.
/** Where an environment's authentication hostname is in its activation. */
export const AUTH_PROJECT_DOMAIN_STATUSES = {
    pending: "pending",
    active: "active",
    proofWithdrawn: "proof-withdrawn",
    disabled: "disabled",
    releasing: "releasing",
};
/** Whether the realm holds installed capacity. */
export const AUTH_PROJECT_DOMAIN_LIFECYCLES = {
    unclaimed: "unclaimed",
    admitted: "admitted",
    paused: "paused",
    retiring: "retiring",
    retired: "retired",
};
/** Whether the realm runs the images it is expected to. */
export const AUTH_PROJECT_DOMAIN_CONVERGENCES = {
    converged: "converged",
    drifted: "drifted",
    notRunning: "not-running",
    unverified: "unverified",
};
/** Where the realm's expected image identity comes from. */
export const AUTH_PROJECT_DOMAIN_IMAGE_SOURCES = {
    releaseDefault: "release-default",
    override: "override",
    undeclared: "undeclared",
};
/** The realm workload an incident image override pins. */
export const AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS = {
    gateway: "gateway",
    hydra: "hydra",
};
