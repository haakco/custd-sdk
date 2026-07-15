import { describe, expect, it } from "vitest";
import { AsyncEventQueue, type AsyncQueueStorage, type EventEnvelope } from "./index";

class DeferredMemoryStorage implements AsyncQueueStorage {
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
    eventTypeSlug: "app.opened",
    schemaVersion: "1.0.0",
    timestamp: "2026-07-15T00:00:00.000Z",
    context: { device: { type: "mobile" } },
    payload: {},
  };
}

describe("AsyncEventQueue", () => {
  it("persists stable event IDs across an asynchronous storage restart", async () => {
    const storage = new DeferredMemoryStorage();
    const first = new AsyncEventQueue(storage, 3);
    await first.load();
    await first.enqueue(event("evt-stable"));

    const restarted = new AsyncEventQueue(storage, 3);
    await restarted.load();

    await expect(restarted.peek(10)).resolves.toMatchObject([{ eventUuid: "evt-stable" }]);
  });

  it("evicts the oldest event at the bounded capacity", async () => {
    const queue = new AsyncEventQueue(new DeferredMemoryStorage(), 2);
    await queue.load();
    await queue.enqueue(event("evt-1"));
    await queue.enqueue(event("evt-2"));
    await queue.enqueue(event("evt-3"));

    await expect(queue.peek(10)).resolves.toMatchObject([{ eventUuid: "evt-2" }, { eventUuid: "evt-3" }]);
  });

  it("acknowledges only accepted IDs so a partial batch failure remains queued", async () => {
    const queue = new AsyncEventQueue(new DeferredMemoryStorage(), 3);
    await queue.load();
    await queue.enqueue(event("evt-accepted"));
    await queue.enqueue(event("evt-retry"));

    await queue.acknowledge(["evt-accepted"]);

    await expect(queue.peek(10)).resolves.toMatchObject([{ eventUuid: "evt-retry" }]);
  });
});
