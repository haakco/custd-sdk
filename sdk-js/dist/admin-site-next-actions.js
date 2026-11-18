// What to do next: one domain's status and its most important actions, and the
// tenant's portfolio of domains, worst first. Custd ranks them once, in a fixed
// order that never depends on AI, so every product shows the same first action.
// SiteDomainAdminClient sends the calls. A site-bound credential reads only its
// own Site; a site_insights.read credential reads these two calls for every Site
// and nothing else.
/** A next-actions read returns at most this many actions. */
export const SITE_NEXT_ACTIONS_MAX = 3;
/**
 * The kinds of SiteNextAction, in the order Custd ranks them. Custd may add kinds;
 * show one this SDK does not name by its title and why.
 */
export const SiteNextActionKind = {
    Verify: "verify",
    Outage: "outage",
    Certificate: "certificate",
    ReconnectSearch: "reconnect-search",
    Finding: "finding",
    FirstAuditPending: "first-audit-pending",
    ConnectSearch: "connect-search",
};
/** Where an action is done. Custd may add places. */
export const SiteNextActionPlace = {
    Ownership: "ownership",
    Uptime: "uptime",
    SearchSettings: "search-settings",
    Audit: "audit",
    Finding: "finding",
    Page: "page",
};
/** What Custd cannot check yet. */
export const SiteNotChecked = {
    Uptime: "uptime",
    Audit: "audit",
    Search: "search",
};
