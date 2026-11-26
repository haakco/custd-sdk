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
    /**
     * The event schema version every tracked event declares, as the collector
     * knows it. It must name a version the collector has enabled for the event
     * type, so a Site whose `page-view` schema is not `1.0.0` sets it here.
     */
    schemaVersion?: string;
    /**
     * The schema version `page-view` events declare, when it differs from
     * `schemaVersion`. The script tag sets it from the Site's configuration, so a
     * tenant that moves its page-view schema to a new version keeps receiving page
     * views without changing the embed. Other event types keep `schemaVersion`.
     */
    pageViewSchemaVersion?: string;
    /**
     * Deployment labels sent with every tracked event, such as the cluster and
     * region this build runs in. They are controlled deployment metadata, not
     * visitor data: every key and value must already exist in the tenant's label
     * catalogue, and the reserved `custd.` namespace stays with the SDK, so
     * `custd.environment` still comes only from `environment`.
     */
    labels?: Record<string, string>;
    identityMode?: BrowserIdentityMode;
    consent?: "granted" | "required";
    batchSize?: number;
    maxQueueSize?: number;
    persistentQueue?: boolean;
    queueStorage?: QueueStorage;
    retry?: RetryOptions;
    trackInitialPageView?: boolean;
    /**
     * Captures real-user Core Web Vitals (LCP, INP, CLS, FCP and TTFB) for the
     * page the visitor landed on, and sends them as one `web-vitals` event when
     * the page is first hidden. Off unless set; the script tag turns it on with
     * `data-web-vitals="true"`. A metric the browser does not report is omitted.
     */
    webVitals?: boolean;
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
    siteUuid?: string;
    /** The environment the Site's events default to. */
    environment?: string;
    identityMode?: BrowserIdentityMode;
    allowedOrigins?: string[];
    /** The page-view schema version the Site's tenant accepts; absent when it has none. */
    pageViewSchemaVersion?: string;
};
/**
 * AI assistants whose links bring visitors, by referrer hostname, mapped to the
 * assistant name sent as `aiAssistant`. A page view only ever carries this class
 * and name, never the referrer URL itself.
 */
export declare const aiAssistantReferrers: ReadonlyMap<string, string>;
export declare function createBrowserTracker(config: BrowserTrackerConfig): BrowserTracker;
export declare function installBrowserTrackerFromScript(scriptElement?: HTMLScriptElement): Promise<BrowserTracker>;
/** Reads a registered browser Site's public identity mode and allowed origins. */
export declare function fetchBrowserSiteConfig(baseUrl: string, siteUuid: string, fetchImpl?: typeof fetch): Promise<BrowserSiteConfig>;
/** The AI assistant a referrer URL names, or undefined for any other or unreadable referrer. */
export declare function aiAssistantReferrer(referrer: string): string | undefined;
/** An extended-identity Site waits for consent; a cookieless Site tracks without it. */
export declare function defaultSiteConsent(siteConfig: BrowserSiteConfig): BrowserTrackerConfig["consent"];
/** Extended-identity Sites batch; cookieless Sites send each event as it happens. */
export declare function defaultSiteBatchSize(siteConfig: BrowserSiteConfig): number;
declare global {
    interface Window {
        custd: {
            track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
            trackPageView: () => Promise<void>;
            setConsent: (state: BrowserConsentState) => void;
        };
    }
}
/**
 * The Site configuration's page-view version, or undefined when it is absent or
 * malformed, so an unexpected configuration falls back to the default rather
 * than stopping the tracker.
 */
export declare function siteConfigSchemaVersion(value: unknown): string | undefined;
