import type { EventEnvelope } from "./index.js";
export type AsyncQueueStorage = {
    load: () => Promise<EventEnvelope[]>;
    save: (events: EventEnvelope[]) => Promise<void>;
    clear: () => Promise<void>;
};
export declare class AsyncEventQueue {
    private readonly storage;
    private readonly maxQueueSize;
    private events;
    private loaded;
    private pending;
    constructor(storage: AsyncQueueStorage, maxQueueSize: number);
    load(): Promise<void>;
    enqueue(event: EventEnvelope): Promise<void>;
    peek(limit: number): Promise<EventEnvelope[]>;
    acknowledge(eventUUIDs: readonly string[]): Promise<void>;
    clear(): Promise<void>;
    private run;
    private requireLoaded;
    private trimToCapacity;
}
