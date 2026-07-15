import { describe, expect, it, vi } from "vitest";
import {
  createMobileAsyncQueueStorage,
  createMobileFlushTriggers,
  type EventEnvelope,
  type MobileAppState,
  type MobileKeyValueStorage,
  type MobileNetworkState,
} from "./index";

class MemoryKeyValueStorage implements MobileKeyValueStorage {
  private values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

function event(eventUuid: string): EventEnvelope {
  return {
    eventUuid,
    eventTypeSlug: "app.opened",
    schemaVersion: "1.0.0",
    timestamp: "2026-07-15T00:00:00.000Z",
    context: { device: { type: "mobile" } },
    payload: {},
  };
}

describe("mobile reference adapter", () => {
  it("adapts an injected async key-value store without importing a mobile dependency", async () => {
    const storage = createMobileAsyncQueueStorage(new MemoryKeyValueStorage(), "custd.events");
    await storage.save([event("evt-1")]);

    await expect(storage.load()).resolves.toMatchObject([{ eventUuid: "evt-1" }]);
    await storage.clear();
    await expect(storage.load()).resolves.toEqual([]);
  });

  it("flushes when the app becomes active or the network reconnects, then removes both listeners", async () => {
    const appListeners: Array<(state: string) => void> = [];
    const networkListeners: Array<(state: MobileNetworkState) => void> = [];
    const removeApp = vi.fn();
    const removeNetwork = vi.fn();
    const appState: MobileAppState = {
      addEventListener: (_event, listener) => {
        appListeners.push(listener);
        return { remove: removeApp };
      },
    };
    const network = {
      addEventListener: (listener: (state: MobileNetworkState) => void) => {
        networkListeners.push(listener);
        return removeNetwork;
      },
    };
    const flush = vi.fn().mockResolvedValue(undefined);

    const remove = createMobileFlushTriggers({ appState, network })(flush);
    appListeners[0]("background");
    networkListeners[0]({ isConnected: false, isInternetReachable: false });
    appListeners[0]("active");
    networkListeners[0]({ isConnected: true, isInternetReachable: true });
    await vi.waitFor(() => expect(flush).toHaveBeenCalledTimes(2));

    remove();
    expect(removeApp).toHaveBeenCalledOnce();
    expect(removeNetwork).toHaveBeenCalledOnce();
  });

  it("treats malformed persisted queue data as empty", async () => {
    const storage = new MemoryKeyValueStorage();
    await storage.setItem("custd.events", "not-json");

    await expect(createMobileAsyncQueueStorage(storage, "custd.events").load()).resolves.toEqual([]);
  });
});
