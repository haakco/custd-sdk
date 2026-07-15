import type { EventEnvelope } from "./index.js";
import type { AsyncQueueStorage } from "./mobile-queue.js";

// These narrow interfaces match the AsyncStorage, AppState, and NetInfo seams
// used by Expo apps without making either Expo package a SDK dependency.
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

export type MobileSubscription = { remove: () => void } | (() => void);

export type MobileFlushTriggerOptions = {
  appState: MobileAppState;
  network: MobileNetwork;
};

export function createMobileAsyncQueueStorage(storage: MobileKeyValueStorage, key: string): AsyncQueueStorage {
  if (!key) {
    throw new Error("custd: mobile queue storage key is required");
  }
  return {
    async load(): Promise<EventEnvelope[]> {
      const raw = await storage.getItem(key);
      if (!raw) {
        return [];
      }
      try {
        const events: unknown = JSON.parse(raw);
        return Array.isArray(events) ? (events as EventEnvelope[]) : [];
      } catch {
        return [];
      }
    },
    save(events: EventEnvelope[]): Promise<void> {
      return storage.setItem(key, JSON.stringify(events));
    },
    clear(): Promise<void> {
      return storage.removeItem(key);
    },
  };
}

export function createMobileFlushTriggers(
  options: MobileFlushTriggerOptions,
): (flush: () => Promise<void>) => () => void {
  return (flush) => {
    const flushSafely = () => {
      void flush().catch(() => undefined);
    };
    const appSubscription = options.appState.addEventListener("change", (state) => {
      if (state === "active") {
        flushSafely();
      }
    });
    const networkSubscription = options.network.addEventListener((state) => {
      if (isReachable(state)) {
        flushSafely();
      }
    });
    return () => {
      removeMobileSubscription(appSubscription);
      removeMobileSubscription(networkSubscription);
    };
  };
}

function isReachable(state: MobileNetworkState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function removeMobileSubscription(subscription: MobileSubscription): void {
  if (typeof subscription === "function") {
    subscription();
    return;
  }
  subscription.remove();
}
