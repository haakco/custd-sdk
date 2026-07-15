export function createMobileAsyncQueueStorage(storage, key) {
    if (!key) {
        throw new Error("custd: mobile queue storage key is required");
    }
    return {
        async load() {
            const raw = await storage.getItem(key);
            if (!raw) {
                return [];
            }
            try {
                const events = JSON.parse(raw);
                return Array.isArray(events) ? events : [];
            }
            catch {
                return [];
            }
        },
        save(events) {
            return storage.setItem(key, JSON.stringify(events));
        },
        clear() {
            return storage.removeItem(key);
        },
    };
}
export function createMobileFlushTriggers(options) {
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
function isReachable(state) {
    return state.isConnected === true && state.isInternetReachable !== false;
}
function removeMobileSubscription(subscription) {
    if (typeof subscription === "function") {
        subscription();
        return;
    }
    subscription.remove();
}
