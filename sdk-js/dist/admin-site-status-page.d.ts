/** A verified domain and the label customers see for it. */
export type SiteStatusPageSelection = {
    domainUuid: string;
    label: string;
};
/** The title and components to preview or publish. */
export type SiteStatusPageDraft = {
    title: string;
    components: SiteStatusPageSelection[];
};
/**
 * The state a status page shows for one component: `unknown` (no recent check), `failing`
 * (one failed check, not yet an outage), `down` (an open incident), `maintenance` (inside a
 * scheduled maintenance window).
 */
export type SiteStatusComponentStatus = "unknown" | "up" | "failing" | "down" | "paused" | "maintenance";
/** The public projection of a selected component; lastCheckedAt is absent before its first check. */
export type SiteStatusComponent = {
    label: string;
    status: SiteStatusComponentStatus;
    lastCheckedAt?: string;
};
/** An update approved for public display. */
export type SiteStatusUpdate = {
    message: string;
    publishedAt: string;
};
/** The preview of what customers can see. */
export type SiteStatusPage = {
    title: string;
    components: SiteStatusComponent[];
    updates: SiteStatusUpdate[];
};
/** Identifies a published status page; build its link with siteStatusPagePublicUrl. */
export type SiteStatusPagePublication = {
    publicKey: string;
    publishedAt: string;
};
/** The private editor state for the Site; each part is absent until saved or published. */
export type SiteStatusPageSettings = {
    draft?: SiteStatusPageDraft;
    publication?: SiteStatusPagePublication;
};
/** A reviewed customer message and a stable ID, so a retry does not post it twice. */
export type SiteStatusUpdateRequest = {
    requestUuid: string;
    message: string;
};
/** The latest published updates. */
export type SiteStatusUpdateHistory = {
    updates: SiteStatusUpdate[];
};
/**
 * The link customers open, on the Custd panel origin (https://custd.com in production). The key
 * stays in the fragment, so it is never sent to a server or written to an access log.
 */
export declare function siteStatusPagePublicUrl(panelOrigin: string, publication: SiteStatusPagePublication): string;
