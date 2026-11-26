import { describe, expect, it } from "vitest";
import { CustdClient } from "./index";

function clientReplying(body: unknown): CustdClient {
  const fetchImpl = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
  return new CustdClient({ baseUrl: "http://localhost:8087", getToken: () => "token", fetch: fetchImpl });
}

describe("ingest operations decoding", () => {
  it("maps capitalized cleanup approvals and null lists", async () => {
    const job = await clientReplying({
      jobUuid: "job-1",
      status: "queued",
      items: null,
      approval: { Identity: "ops@example.com", ExpiresAt: "2026-11-27T00:00:00Z" },
    }).ingestOperations.getCleanupJob("job-1");
    expect(job.items).toEqual([]);
    expect(job.approval).toEqual({ identity: "ops@example.com", expiresAt: "2026-11-27T00:00:00Z" });
  });

  it("wraps the bare alert array and renames its type to severity", async () => {
    const list = await clientReplying([
      { id: "all-ok", type: "info", title: "OK", message: "" },
    ]).ingestOperations.monitoringAlerts();
    expect(list.alerts).toEqual([{ id: "all-ok", severity: "info", title: "OK", message: "" }]);
  });

  it("maps snake-case monitoring counters and the integrity orphan list", async () => {
    const summary = await clientReplying({
      ingest_requests_total: 5,
      raw_storage_s3_total: 2,
    }).ingestOperations.monitoringSummary();
    expect(summary.ingestRequestsTotal).toBe(5);
    expect(summary.rawStorageS3Total).toBe(2);
    const integrity = await clientReplying({ checkedCount: 3, orphanedUUIDs: null }).ingestOperations.checkIntegrity();
    expect(integrity).toEqual({ checkedCount: 3, orphanedUuids: [] });
  });
});

describe("acting company", () => {
  type Sent = { url: string; effectiveCompany: string | null };
  const actingReply = {
    jobUuid: "job-1",
    status: "queued",
    items: null,
    approval: { Identity: "ops@example.com", ExpiresAt: "2026-11-27T00:00:00Z" },
    jobs: null,
    grants: [],
  };

  function actingClient(actingCompanySlug?: string): { client: CustdClient; sent: Sent[] } {
    const sent: Sent[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      sent.push({ url: String(input), effectiveCompany: headers.get("X-Custd-Effective-Company") });
      return new Response(JSON.stringify(actingReply), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const client = new CustdClient({
      baseUrl: "http://localhost:8087",
      getToken: () => "token",
      fetch: fetchImpl,
      actingCompanySlug,
    });
    return { client, sent };
  }

  it("names the tenant in the header the cleanup-job reads and cancel take it from", async () => {
    const { client, sent } = actingClient("awthy");
    await client.ingestOperations.listCleanupJobs();
    await client.ingestOperations.getCleanupJob("job-1");
    await client.ingestOperations.getCleanupJobProof("job-1");
    await client.ingestOperations.cancelCleanupJob("job-1");
    expect(sent.map((request) => request.effectiveCompany)).toEqual(["awthy", "awthy", "awthy", "awthy"]);
  });

  it("targets admin routes by query and never opens support context there", async () => {
    const { client, sent } = actingClient("awthy");
    await client.admin.supportAccess.list();
    expect(sent[0].url).toContain("companySlug=awthy");
    expect(sent[0].effectiveCompany).toBeNull();
  });

  it("sends neither selector when unset", async () => {
    const { client, sent } = actingClient();
    await client.ingestOperations.listCleanupJobs();
    await client.admin.supportAccess.list();
    expect(sent.map((request) => request.effectiveCompany)).toEqual([null, null]);
    expect(sent[1].url).not.toContain("companySlug");
  });
});
