// AsyncEventQueue serializes storage mutations so an offline client retains
// event IDs and ordering across restart, retry, and partial batch outcomes.
export class AsyncEventQueue {
    constructor(storage, maxQueueSize) {
        this.storage = storage;
        this.maxQueueSize = maxQueueSize;
        this.events = [];
        this.loaded = false;
        this.pending = Promise.resolve();
        if (!Number.isSafeInteger(maxQueueSize) || maxQueueSize <= 0) {
            throw new Error("custd: async queue maxQueueSize must be a positive integer");
        }
    }
    load() {
        return this.run(async () => {
            const stored = await this.storage.load();
            this.events = Array.isArray(stored) ? [...stored] : [];
            this.trimToCapacity();
            this.loaded = true;
            await this.storage.save(this.events);
        });
    }
    enqueue(event) {
        return this.run(async () => {
            this.requireLoaded();
            this.events.push(event);
            this.trimToCapacity();
            await this.storage.save(this.events);
        });
    }
    peek(limit) {
        return this.run(async () => {
            this.requireLoaded();
            return this.events.slice(0, normalizeLimit(limit, this.events.length));
        });
    }
    acknowledge(eventUUIDs) {
        return this.run(async () => {
            this.requireLoaded();
            const accepted = new Set(eventUUIDs);
            this.events = this.events.filter((event) => !accepted.has(event.eventUuid ?? ""));
            await this.storage.save(this.events);
        });
    }
    clear() {
        return this.run(async () => {
            this.requireLoaded();
            this.events = [];
            await this.storage.clear();
        });
    }
    run(operation) {
        const result = this.pending.then(operation, operation);
        this.pending = result.then(() => undefined, () => undefined);
        return result;
    }
    requireLoaded() {
        if (!this.loaded) {
            throw new Error("custd: async queue must load before use");
        }
    }
    trimToCapacity() {
        if (this.events.length > this.maxQueueSize) {
            this.events = this.events.slice(-this.maxQueueSize);
        }
    }
}
function normalizeLimit(limit, available) {
    if (!Number.isSafeInteger(limit) || limit <= 0) {
        throw new Error("custd: async queue limit must be a positive integer");
    }
    return Math.min(limit, available);
}
