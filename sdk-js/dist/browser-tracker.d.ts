import { type QueueStorage, type RetryOptions } from "./index.js";
export type BrowserIdentityMode = "cookieless" | "extended";
export type BrowserConsentState = "granted" | "denied";
export type BrowserTrackerConfig = {
    baseUrl: string;
    siteUuid: string;
    writeKey: string;
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
export declare function installBrowserTrackerFromScript(): Promise<BrowserTracker>;
declare global {
    interface Window {
        custd: {
            track: (eventTypeSlug: string, payload?: Record<string, unknown>) => Promise<void>;
            trackPageView: () => Promise<void>;
            setConsent: (state: BrowserConsentState) => void;
        };
    }
}
