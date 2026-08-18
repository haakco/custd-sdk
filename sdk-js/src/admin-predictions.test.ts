import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustdClient } from "./index";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CustdClient prediction admin", () => {
  it("keeps prediction configuration tenant-scoped and preserves source arrays", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uuid: "definition-1",
            definition_key: "quota",
            display_name: "Quota",
            status: "draft",
            schedule_kind: "interval",
            is_paused: false,
            created_at: "2026-08-12T12:00:00Z",
            updated_at: "2026-08-12T12:00:00Z",
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              uuid: "source-1",
              source_key: "status",
              source_mode: "http_json",
              display_name: "Status",
              source_status: "active",
              is_paused: false,
              created_at: "2026-08-12T12:00:00Z",
              updated_at: "2026-08-12T12:00:00Z",
              consecutive_failed_count: 0,
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 202 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "admin-token" });

    const definition = await client.admin.predictions.createDefinition("acme", {
      definition_key: "quota",
      display_name: "Quota",
    });
    const sources = await client.admin.predictions.listSignalSources("acme", 10, "next");
    await client.admin.predictions.runNow("acme", "definition-1", { worker_id: "proof" });

    expect(definition.uuid).toBe("definition-1");
    expect(sources).toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8080/api/v1/admin/measurement/predictions/definitions?companySlug=acme",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://localhost:8080/api/v1/admin/measurement/predictions/sources?companySlug=acme&pageSize=10&pageToken=next",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "http://localhost:8080/api/v1/admin/measurement/predictions/definitions/definition-1/run-now?companySlug=acme",
    );
  });
});
