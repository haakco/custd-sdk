import type { EventEnvelope } from "./index.js";

// AsyncQueueStorage permits runtime adapters such as Expo AsyncStorage without
// imposing a mobile storage dependency on other SDK consumers.
export type AsyncQueueStorage = {
  load: () => Promise<EventEnvelope[]>;
  save: (events: EventEnvelope[]) => Promise<void>;
  clear: () => Promise<void>;
};

// AsyncEventQueue serializes storage mutations so an offline client retains
// event IDs and ordering across restart, retry, and partial batch outcomes.
export class AsyncEventQueue {
  private events: EventEnvelope[] = [];
  private loaded = false;
  private pending: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: AsyncQueueStorage,
    private readonly maxQueueSize: number,
  ) {
    if (!Number.isSafeInteger(maxQueueSize) || maxQueueSize <= 0) {
      throw new Error("custd: async queue maxQueueSize must be a positive integer");
    }
  }

  load(): Promise<void> {
    return this.run(async () => {
      const stored = await this.storage.load();
      this.events = Array.isArray(stored) ? [...stored] : [];
      this.trimToCapacity();
      this.loaded = true;
      await this.storage.save(this.events);
    });
  }

  enqueue(event: EventEnvelope): Promise<void> {
    return this.run(async () => {
      this.requireLoaded();
      this.events.push(event);
      this.trimToCapacity();
      await this.storage.save(this.events);
    });
  }

  peek(limit: number): Promise<EventEnvelope[]> {
    return this.run(async () => {
      this.requireLoaded();
      return this.events.slice(0, normalizeLimit(limit, this.events.length));
    });
  }

  acknowledge(eventUUIDs: readonly string[]): Promise<void> {
    return this.run(async () => {
      this.requireLoaded();
      const accepted = new Set(eventUUIDs);
      this.events = this.events.filter((event) => !accepted.has(event.eventUuid ?? ""));
      await this.storage.save(this.events);
    });
  }

  clear(): Promise<void> {
    return this.run(async () => {
      this.requireLoaded();
      this.events = [];
      await this.storage.clear();
    });
  }

  private run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation, operation);
    this.pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private requireLoaded(): void {
    if (!this.loaded) {
      throw new Error("custd: async queue must load before use");
    }
  }

  private trimToCapacity(): void {
    if (this.events.length > this.maxQueueSize) {
      this.events = this.events.slice(-this.maxQueueSize);
    }
  }
}

function normalizeLimit(limit: number, available: number): number {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("custd: async queue limit must be a positive integer");
  }
  return Math.min(limit, available);
}
