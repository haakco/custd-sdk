import type { SiteAIMode } from "./admin-site-ai.js";
/** A next-actions read returns at most this many actions. */
export declare const SITE_NEXT_ACTIONS_MAX = 3;
/**
 * The kinds of SiteNextAction, in the order Custd ranks them. Custd may add kinds;
 * show one this SDK does not name by its title and why.
 */
export declare const SiteNextActionKind: {
    readonly Verify: "verify";
    readonly Outage: "outage";
    readonly Certificate: "certificate";
    readonly ReconnectSearch: "reconnect-search";
    readonly Finding: "finding";
    readonly FirstAuditPending: "first-audit-pending";
    readonly ConnectSearch: "connect-search";
};
/** Where an action is done. Custd may add places. */
export declare const SiteNextActionPlace: {
    readonly Ownership: "ownership";
    readonly Uptime: "uptime";
    readonly SearchSettings: "search-settings";
    readonly Audit: "audit";
    readonly Finding: "finding";
    readonly Page: "page";
};
/** What Custd cannot check yet. */
export declare const SiteNotChecked: {
    readonly Uptime: "uptime";
    readonly Audit: "audit";
    readonly Search: "search";
};
export type SiteNextActionTarget = {
    /** A SiteNextActionPlace value. */
    place: string;
    /** A finding action's first finding. */
    findingUuid?: string;
    /** A finding action's first page; opens Page detail when place is page. */
    pageUrl?: string;
};
export type SiteNextAction = {
    /** A SiteNextActionKind value. */
    kind: string;
    title: string;
    why: string;
    /** high, medium, low or info. */
    severity: "high" | "medium" | "low" | "info";
    /** The pages a finding affects; 0 for an action about the whole site. */
    affectedCount: number;
    /** The rule of a finding action. */
    rule?: string;
    target: SiteNextActionTarget;
    /** Check again (Verify now, or a one-page recheck) can confirm the fix at once. */
    recheckable: boolean;
};
export type SiteNextActions = {
    aiMode?: SiteAIMode;
    domainUuid: string;
    host: string;
    /** unknown, up, failing, down or paused. */
    status: "unknown" | "up" | "failing" | "down" | "paused";
    /** One plain sentence: whether the site works and how much is left to do. */
    headline: string;
    /** The latest uptime check. */
    checkedAt?: string;
    /** SiteNotChecked values. */
    notChecked: string[];
    /** Every action the domain has; at most SITE_NEXT_ACTIONS_MAX are in actions. */
    actionCount: number;
    /** Most important first. */
    actions: SiteNextAction[];
};
export type SiteFindingCounts = {
    high: number;
    medium: number;
    low: number;
    info: number;
};
export type SitePortfolioDomain = {
    domainUuid: string;
    siteUuid: string;
    host: string;
    status: "unknown" | "up" | "failing" | "down" | "paused";
    headline: string;
    checkedAt?: string;
    actionCount: number;
    openFindings: SiteFindingCounts;
    /** Absent when there is nothing to do. */
    firstAction?: SiteNextAction;
};
export type SitePortfolioSummary = {
    /** Worst first: by the first action's rank, then by host. */
    domains: SitePortfolioDomain[];
};
