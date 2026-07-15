import { describe, expect, it, vi } from "vitest";
import {
  AsyncEventQueue,
  type AsyncQueueStorage,
  createMobileFlushTriggers,
  type EventEnvelope,
  type MobileAppState,
  type MobileNetworkState,
} from "./index";

class MemoryAsyncQueueStorage implements AsyncQueueStorage {
  private events: EventEnvelope[] = [];

  async load(): Promise<EventEnvelope[]> {
    return [...this.events];
  }

  async save(events: EventEnvelope[]): Promise<void> {
    this.events = [...events];
  }

  async clear(): Promise<void> {
    this.events = [];
  }
}

function event(eventUuid: string): EventEnvelope {
  return {
    eventUuid,
    eventTypeSlug: "mobile.screen.opened",
    schemaVersion: "1.0.0",
    timestamp: "2026-07-15T00:00:00.000Z",
    context: { device: { type: "mobile" } },
    payload: {},
  };
}

describe("mobile relay queue fixture", () => {
  it("persists offline events, flushes on reconnect or app activation, and retains only unacknowledged stable IDs", async () => {
    const storage = new MemoryAsyncQueueStorage();
    const initialQueue = new AsyncEventQueue(storage, 10);
    await initialQueue.load();
    await initialQueue.enqueue(event("evt-stable-1"));
    await initialQueue.enqueue(event("evt-stable-2"));

    const restartedQueue = new AsyncEventQueue(storage, 10);
    await restartedQueue.load();
    const relay = vi
      .fn<(events: EventEnvelope[]) => Promise<string[]>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(["evt-stable-1"])
      .mockResolvedValueOnce(["evt-stable-2"]);
    const flush = async () => {
      const batch = await restartedQueue.peek(50);
      const acceptedIDs = await relay(batch);
      await restartedQueue.acknowledge(acceptedIDs);
    };

    await expect(flush()).rejects.toThrow("offline");
    await expect(restartedQueue.peek(50)).resolves.toMatchObject([
      { eventUuid: "evt-stable-1" },
      { eventUuid: "evt-stable-2" },
    ]);

    const appListeners: Array<(state: string) => void> = [];
    const networkListeners: Array<(state: MobileNetworkState) => void> = [];
    const appState: MobileAppState = {
      addEventListener: (_event, listener) => {
        appListeners.push(listener);
        return { remove: vi.fn() };
      },
    };
    const remove = createMobileFlushTriggers({
      appState,
      network: {
        addEventListener: (listener) => {
          networkListeners.push(listener);
          return () => undefined;
        },
      },
    })(flush);

    networkListeners[0]({ isConnected: true, isInternetReachable: true });
    await vi.waitFor(async () => {
      await expect(restartedQueue.peek(50)).resolves.toMatchObject([{ eventUuid: "evt-stable-2" }]);
    });
    appListeners[0]("active");
    await vi.waitFor(async () => await expect(restartedQueue.peek(50)).resolves.toEqual([]));

    expect(relay.mock.calls.map(([events]) => events.map((item) => item.eventUuid))).toEqual([
      ["evt-stable-1", "evt-stable-2"],
      ["evt-stable-1", "evt-stable-2"],
      ["evt-stable-2"],
    ]);
    remove();
  });
});
