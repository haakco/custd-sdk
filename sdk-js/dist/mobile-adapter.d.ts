import type { AsyncQueueStorage } from "./mobile-queue.js";
export type MobileKeyValueStorage = {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
};
export type MobileAppState = {
    addEventListener: (event: "change", listener: (state: string) => void) => MobileSubscription;
};
export type MobileNetworkState = {
    isConnected: boolean | null;
    isInternetReachable?: boolean | null;
};
export type MobileNetwork = {
    addEventListener: (listener: (state: MobileNetworkState) => void) => MobileSubscription;
};
export type MobileSubscription = {
    remove: () => void;
} | (() => void);
export type MobileFlushTriggerOptions = {
    appState: MobileAppState;
    network: MobileNetwork;
};
export declare function createMobileAsyncQueueStorage(storage: MobileKeyValueStorage, key: string): AsyncQueueStorage;
export declare function createMobileFlushTriggers(options: MobileFlushTriggerOptions): (flush: () => Promise<void>) => () => void;
