import { type QueueStorage, type RetryOptions } from "./index.js";
export type BrowserIdentityMode = "cookieless" | "extended";
export type BrowserConsentState = "granted" | "denied";
/** The page context the tracker derives before any provider runs. */
export type BrowserPageContextDefaults = {
    /** `location.pathname` after the built-in sanitizer redacts identifiers. */
    path: string;
    /** `document.title` as the page set it. */
    title: string;
};
/**
 * The page context sent with an event. An absent field is not sent, so a
 * provider can omit the title instead of forwarding page content.
 */
export type BrowserPageContext = {
    path?: string;
    title?: string;
};
/**
 * A sanitized description of a failure the tracker handled on its own. It never
 * carries error messages, request bodies, or collector response payloads.
 */
export type BrowserTrackerFailure = {
    /** The automatic call that failed. */
    source: "page-view" | "flush";
    /** Collector HTTP status, when the collector answered. */
    status?: number;
    /** Events the collector permanently rejected, which the tracker dropped. */
    rejectedEvents?: number;
};
export type BrowserTrackerConfig = {
    baseUrl: string;
    siteUuid: string;
    writeKey: string;
    /**
     * The environment this build runs in, for a preview deployment, a staging
     * host, or a local server that shares the same Site. It is sent as the
     * reserved `custd.environment` label; a Site serves every environment unless
     * an operator restricts it, so this is not a second credential.
     */
    environment?: string;
    allowedOrigins?: string[];
    identityMode?: BrowserIdentityMode;
    consent?: "granted" | "required";
    batchSize?: number;
    maxQueueSize?: number;
    persistentQueue?: boolean;
    queueStorage?: QueueStorage;
    retry?: RetryOptions;
    trackInitialPageView?: boolean;
    /**
     * Replaces the page context derived from `location.pathname` and
     * `document.title`. Return a normalized route template such as
     * `/companies/:companySlug/dashboard`, omit `title` so page content is never
     * sent, or return an empty object to send no page context. A path that is not
     * a safe route path, such as a full URL or a path carrying a query, is
     * replaced with the built-in sanitized path; a provider that throws sends no
     * page context rather than falling back to page content.
     */
    pageContext?: (defaults: BrowserPageContextDefaults) => BrowserPageContext;
    /**
     * Observes automatic tracking failures, which the tracker isolates instead of
     * raising as unhandled rejections. Manual calls still reject.
     */
    onFailure?: (failure: BrowserTrackerFailure) => void;
};
export type BrowserTracker = {
    track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
    trackPageView: () => Promise<void>;
    installSpaTracking: () => void;
    setConsent: (state: BrowserConsentState) => void;
    flush: () => Promise<void>;
    close: () => void;
};
export type BrowserSiteConfig = {
    identityMode?: BrowserIdentityMode;
    allowedOrigins?: string[];
};
export declare function createBrowserTracker(config: BrowserTrackerConfig): BrowserTracker;
export declare function installBrowserTrackerFromScript(scriptElement?: HTMLScriptElement): Promise<BrowserTracker>;
declare global {
    interface Window {
        custd: {
            track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
            trackPageView: () => Promise<void>;
            setConsent: (state: BrowserConsentState) => void;
        };
    }
}
