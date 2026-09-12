import { type QueueStorage, type RetryOptions } from "./index.js";
export type BrowserIdentityMode = "cookieless" | "extended";
export type BrowserConsentState = "granted" | "denied";
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
