import { describe, expect, it, vi } from "vitest";
import { CustdClient } from "./index";
import { MAX_PARSER_FRAMING_LINES, MAX_PARSER_FRAMING_RECORD_BYTES } from "./parsers";

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
}

function client(fetchImpl: ReturnType<typeof mockFetch>) {
  return new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch: fetchImpl });
}

const parserFixture = {
  uuid: "11111111-1111-1111-1111-111111111111",
  code: "nginx-combined",
  name: "Nginx combined",
  parserType: "regex",
  pattern: "^\\S+",
  timestampFormat: "2006-01-02T15:04:05Z07:00",
  fieldMapping: { client_ip: "context.ip" },
  generatedFields: null,
  enabled: true,
  revision: 3,
};

const presetFixture = {
  code: "apache-combined",
  name: "Apache combined",
  family: "apache",
  description: "Access log",
  parserType: "regex",
  pattern: "^\\S+",
  timestampFormat: "2006-01-02T15:04:05Z07:00",
  fieldMapping: { client_ip: "context.ip" },
  sample: "127.0.0.1 - -",
  variants: ["combined"],
};

describe("parser client", () => {
  it("lists the built-in preset catalog on the schema-registry route", async () => {
    const fetchImpl = mockFetch({ presets: [presetFixture] });
    const response = await client(fetchImpl).parsers.listPresets();

    expect(fetchImpl.mock.calls.map(([url]) => String(url))).toEqual(["http://localhost:8080/api/v1/parsers/presets"]);
    expect(response.presets[0]?.code).toBe("apache-combined");
    expect(response.presets[0]?.variants).toEqual(["combined"]);
  });

  // The route emits a bare JSON array; the SDK wraps it so a caller never
  // handles an untyped list.
  it("wraps the bare parser array response in a named DTO", async () => {
    const fetchImpl = mockFetch([parserFixture]);
    const response = await client(fetchImpl).parsers.list();

    expect(fetchImpl.mock.calls.map(([url]) => String(url))).toEqual(["http://localhost:8080/api/v1/parsers"]);
    expect(response.parsers[0]?.code).toBe("nginx-combined");
    expect(response.parsers[0]?.enabled).toBe(true);
    expect(response.parsers[0]?.revision).toBe(3);
  });

  it("omits an unset enabled from the create body", async () => {
    const fetchImpl = mockFetch(parserFixture, 201);
    await client(fetchImpl).parsers.create({
      code: "nginx-combined",
      name: "Nginx combined",
      parserType: "regex",
      pattern: "^\\S+",
      timestampFormat: "2006-01-02T15:04:05Z07:00",
      fieldMapping: { client_ip: "context.ip" },
    });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://localhost:8080/api/v1/parsers");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty("enabled");
    expect(body.code).toBe("nginx-combined");
  });

  it("addresses update and delete by the explicit parser UUID", async () => {
    const uuid = "11111111-1111-1111-1111-111111111111";
    const updateFetch = mockFetch(parserFixture);
    await client(updateFetch).parsers.update(uuid, {
      code: "nginx-combined",
      name: "Nginx combined",
      parserType: "regex",
      pattern: "^\\S+",
      timestampFormat: "2006-01-02T15:04:05Z07:00",
      fieldMapping: {},
      enabled: false,
    });
    const [updateUrl, updateInit] = updateFetch.mock.calls[0] ?? [];
    expect(String(updateUrl)).toBe(`http://localhost:8080/api/v1/parsers/${uuid}`);
    expect(updateInit?.method).toBe("PUT");
    expect(JSON.parse(String(updateInit?.body))).toMatchObject({ enabled: false });

    const deleteFetch = mockFetch({ deleted: true });
    const deleted = await client(deleteFetch).parsers.delete(uuid);
    const [deleteUrl, deleteInit] = deleteFetch.mock.calls[0] ?? [];
    expect(String(deleteUrl)).toBe(`http://localhost:8080/api/v1/parsers/${uuid}`);
    expect(deleteInit?.method).toBe("DELETE");
    expect(deleted.deleted).toBe(true);
  });

  it("posts the bounded preview and keeps enabled off the previewed definition", async () => {
    const fetchImpl = mockFetch({
      results: [
        { line: 1, ok: true, eventTypeSlug: "access", payload: { status: 200 } },
        { line: 2, ok: false, error: "no match found" },
      ],
      parsed: 1,
      failed: 1,
    });
    const response = await client(fetchImpl).parsers.preview({
      parser: {
        code: "nginx-combined",
        name: "Nginx combined",
        parserType: "regex",
        pattern: "^\\S+",
        timestampFormat: "2006-01-02T15:04:05Z07:00",
        fieldMapping: { client_ip: "context.ip" },
      },
      sample: "127.0.0.1",
      maxLines: 20,
    });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://localhost:8080/api/v1/parser-preview");
    const body = JSON.parse(String(init?.body)) as {
      parser: Record<string, unknown>;
      sample: string;
      maxLines: number;
    };
    expect(body.parser).not.toHaveProperty("enabled");
    expect(body.sample).toBe("127.0.0.1");
    expect(body.maxLines).toBe(20);
    expect(response.parsed).toBe(1);
    expect(response.failed).toBe(1);
    expect(response.results[1]?.error).toBe("no match found");
  });
});

describe("parser framing", () => {
  it("carries the revision-pinned framing on save", async () => {
    const fetchImpl = mockFetch({
      ...parserFixture,
      framing: { type: "docker-json", maxRecordBytes: 262144, maxLines: 200 },
    });
    const parser = await client(fetchImpl).parsers.create({
      code: "docker",
      name: "Docker",
      parserType: "json",
      pattern: null,
      timestampFormat: "2006-01-02T15:04:05Z07:00",
      fieldMapping: {},
      framing: { type: "docker-json", maxRecordBytes: 262144, maxLines: 200 },
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as { framing: Record<string, unknown> };
    expect(body.framing).toEqual({ type: "docker-json", maxRecordBytes: 262144, maxLines: 200 });
    expect(parser.framing).toEqual({ type: "docker-json", maxRecordBytes: 262144, maxLines: 200 });
  });

  it("carries the same framing on preview while keeping enabled off the definition", async () => {
    const fetchImpl = mockFetch({ results: [], parsed: 0, failed: 0 });
    await client(fetchImpl).parsers.preview({
      parser: {
        code: "php",
        name: "PHP",
        parserType: "regex",
        pattern: "^\\S+",
        timestampFormat: "2006-01-02T15:04:05Z07:00",
        fieldMapping: {},
        framing: { type: "php-multiline", maxLines: 200 },
      },
      sample: "line",
      maxLines: 20,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as { parser: Record<string, unknown> };
    expect(body.parser.framing).toEqual({ type: "php-multiline", maxLines: 200 });
    expect(body.parser).not.toHaveProperty("enabled");
  });

  it("rejects an unsupported framing type without sending", async () => {
    const fetchImpl = mockFetch(parserFixture, 201);
    await expect(
      client(fetchImpl).parsers.create({
        code: "x",
        name: "x",
        parserType: "json",
        pattern: null,
        timestampFormat: "t",
        fieldMapping: {},
        framing: { type: "idle" as unknown as "none" },
      }),
    ).rejects.toThrow(RangeError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("parser framing outcome and bounds", () => {
  it("decodes the framing outcome on a preview row", async () => {
    const fetchImpl = mockFetch({
      results: [
        { line: 1, ok: true, framing: "complete", payload: {} },
        { line: 2, ok: false, framing: "oversize", error: "record exceeds the framing bound" },
      ],
      parsed: 1,
      failed: 1,
    });
    const response = await client(fetchImpl).parsers.preview({
      parser: {
        code: "php",
        name: "PHP",
        parserType: "regex",
        pattern: "^\\S+",
        timestampFormat: "2006-01-02T15:04:05Z07:00",
        fieldMapping: {},
        framing: { type: "php-multiline" },
      },
      sample: "line",
      maxLines: 5,
    });
    expect(response.results[0]?.framing).toBe("complete");
    expect(response.results[1]?.framing).toBe("oversize");
  });

  it("rejects out-of-range framing bounds without sending", async () => {
    const cases = [
      { type: "docker-json" as const, maxRecordBytes: -1 },
      { type: "docker-json" as const, maxRecordBytes: MAX_PARSER_FRAMING_RECORD_BYTES + 1 },
      { type: "php-multiline" as const, maxLines: -1 },
      { type: "php-multiline" as const, maxLines: MAX_PARSER_FRAMING_LINES + 1 },
    ];
    for (const framing of cases) {
      const fetchImpl = mockFetch(parserFixture, 201);
      await expect(
        client(fetchImpl).parsers.create({
          code: "x",
          name: "x",
          parserType: "json",
          pattern: null,
          timestampFormat: "t",
          fieldMapping: {},
          framing,
        }),
      ).rejects.toThrow(RangeError);
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });
});
