// A domain's own monitors beside the public uptime check: scheduled-job heartbeats, a private
// uptime probe inside the customer's network, and maintenance windows that pause alerting.
// SiteDomainAdminClient sends the calls.
export const SITE_HEARTBEAT_OUTCOMES = {
    succeeded: "succeeded",
    failed: "failed",
};
export const SITE_HEARTBEAT_STATUSES = {
    pending: "pending",
    onTime: "on-time",
    late: "late",
    missed: "missed",
    failed: "failed",
};
export const PRIVATE_UPTIME_STATUSES = {
    unknown: "unknown",
    up: "up",
    down: "down",
};
export const PRIVATE_UPTIME_FAILURES = {
    dns: "dns",
    connection: "connection",
    tls: "tls",
    timeout: "timeout",
};
