import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { createDogfoodEvent, CustdClient, EventEnvelope, MemoryQueueStorage, validateEvent } from "./index";

const baseEvent: EventEnvelope = {
  eventUuid: "evt-1",
  eventTypeSlug: "page-view",
  schemaVersion: "1.0.0",
  timestamp: new Date().toISOString(),
  sessionId: "sess-1",
  anonymousId: "anon-1",
  companySlug: "test-company",
  context: { device: { type: "desktop" } },
  payload: { foo: "bar" },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("validateEvent", () => {
  it("throws on missing device type", () => {
    expect(() =>
      validateEvent({
        ...baseEvent,
        context: { ...baseEvent.context, device: {} },
      }),
    ).toThrow(/context.device.type/);
  });

  it("accepts the canonical valid fixture", async () => {
    const event = await loadFixture("valid-event.json");

    expect(() => validateEvent(event)).not.toThrow();
  });

  it("rejects the canonical missing-device-type fixture", async () => {
    const event = await loadFixture("invalid-missing-device-type.json");

    expect(() => validateEvent(event)).toThrow(/context.device.type/);
  });

  it("rejects the canonical missing-company-slug fixture", async () => {
    const event = await loadFixture("invalid-missing-company-slug.json");

    expect(() => validateEvent(event)).toThrow(/companySlug/);
  });

  it("accepts the canonical dogfood fixture", async () => {
    const event = await loadFixture("valid-dogfood-event.json");

    expect(() => validateEvent(event)).not.toThrow();
  });
});

describe("createDogfoodEvent", () => {
  it("builds the canonical dogfood event shape", () => {
    const event = createDogfoodEvent({
      eventTypeSlug: "dogfood.producer.metric",
      schemaVersion: "1.0.0",
      companySlug: "haakco",
      sourceSystem: "vorrent",
      sourceCompany: "haakco",
      environment: "production",
      correlationId: "run-123",
      payload: {
        metric: "media_cache.queue_depth",
        value: 7,
        token: "secret",
        sourceSystem: "wrong",
      },
    });

    expect(event.companySlug).toBe("haakco");
    expect(event.context.device?.type).toBe("server");
    expect(event.payload).toMatchObject({
      sourceSystem: "vorrent",
      sourceCompany: "haakco",
      environment: "production",
      schemaVersion: "1.0.0",
      correlationId: "run-123",
      metric: "media_cache.queue_depth",
      value: 7,
    });
    expect(event.payload.token).toBeUndefined();
  });

  it("throws on dropped dogfood payload keys when strict mode is enabled", () => {
    expect(() =>
      createDogfoodEvent({
        eventTypeSlug: "dogfood.producer.metric",
        schemaVersion: "1.0.0",
        companySlug: "haakco",
        sourceSystem: "vorrent",
        sourceCompany: "haakco",
        environment: "production",
        strictPayloadKeys: true,
        payload: {
          metric: "queue_depth",
          nested: { environment: "wrong" },
          token: "secret",
        },
      }),
    ).toThrow(/dropped dogfood payload keys: nested.environment, token/);
  });
});

describe("CustdClient", () => {
  it("generates missing envelope identities before sending", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 202 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "token",
      retry: { maxAttempts: 1 },
    });

    const { eventUuid: _eventUuid, sessionId: _sessionId, anonymousId: _anonymousId, ...event } = baseEvent;
    await client.ingestEvent(event);

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/events");
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sent.eventUuid).toMatch(/[0-9a-f-]{36}/);
    expect(sent.sessionId).toMatch(/[0-9a-f-]{36}/);
    expect(sent.anonymousId).toMatch(/[0-9a-f-]{36}/);
  });

  it("retries on retryable status", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "token",
      retry: { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0, jitter: 0 },
    });

    await client.ingestEvent(baseEvent);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("batches events and flushes when maxBatchSize is reached", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 202 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "token",
      batch: { maxBatchSize: 2 },
      queue: { enabled: true },
      retry: { maxAttempts: 1 },
    });

    await client.track({ ...baseEvent, eventUuid: "evt-1" });
    await client.track({ ...baseEvent, eventUuid: "evt-2" });
    await client.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/events/batch");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).events).toHaveLength(2);
  });

  it("requeues and reports failed flushes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 503 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const storage = new MemoryQueueStorage();

    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      getToken: () => "token",
      batch: { maxBatchSize: 10 },
      queue: { enabled: true, storage },
      retry: { maxAttempts: 1 },
    });

    await client.track(baseEvent);

    await expect(client.flush()).rejects.toThrow(/retryable status 503/);
    expect(storage.load()).toHaveLength(1);
    expect(storage.load()[0].eventUuid).toBe(baseEvent.eventUuid);
  });

  it("uses OAuth2 producer credentials for bearer auth", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "oauth-token", expires_in: 300 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = new CustdClient({
      baseUrl: "http://localhost:8080",
      oauth: {
        clientId: "producer",
        clientSecret: "secret",
        tokenUrl: "http://localhost:4444/oauth2/token",
        audience: "custd",
        scopes: ["events.write"],
      },
      retry: { maxAttempts: 1 },
    });

    await client.ingestEvent(baseEvent);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:4444/oauth2/token");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer oauth-token");
  });

  it("rejects plaintext non-local URLs", () => {
    expect(() =>
      new CustdClient({
        baseUrl: "http://custd.example.com",
        getToken: () => "token",
      }),
    ).toThrow(/baseUrl must use https/);

    expect(() =>
      new CustdClient({
        baseUrl: "https://custd.example.com",
        oauth: {
          clientId: "producer",
          clientSecret: "secret",
          tokenUrl: "http://auth.example.com/oauth2/token",
        },
      }),
    ).toThrow(/tokenUrl must use https/);
  });

  it("allows plaintext localhost URLs", () => {
    expect(() =>
      new CustdClient({
        baseUrl: "http://localhost:8080",
        oauth: {
          clientId: "producer",
          clientSecret: "secret",
          tokenUrl: "http://127.0.0.1:4444/oauth2/token",
        },
      }),
    ).not.toThrow();
  });
});

function loadFixture(name: string): EventEnvelope {
  const url = new URL(`../../contract-fixtures/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as EventEnvelope;
}
