import { describe, expect, it, vi } from "vitest";
import recorded from "../../contract-fixtures/site-insights.json";
import { CustdClient, CustdRequestError, SITE_DOMAIN_NOT_VERIFIED_CODE, SiteRule } from "./index";

const base = "http://localhost:8080/api/v1";
const domainUuid = recorded.domain.domainUuid;
const siteUuid = recorded.domain.siteUuid;

function respond(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function newClient(...responses: Response[]): { client: CustdClient; fetchImpl: ReturnType<typeof vi.fn> } {
  const fetchImpl = vi.fn();
  for (const response of responses) fetchImpl.mockResolvedValueOnce(response);
  const client = new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
  return { client, fetchImpl };
}

function sent(fetchImpl: ReturnType<typeof vi.fn>, index: number): { url: string; method?: string; body?: unknown } {
  const [url, init] = fetchImpl.mock.calls[index] ?? [];
  const request = init as RequestInit;
  return {
    url: String(url),
    method: request.method,
    body: typeof request.body === "string" ? JSON.parse(request.body) : undefined,
  };
}

describe("site domain admin client", () => {
  it("sends every operation to its admin-api route and returns the recorded response", async () => {
    const sites = (...responses: Response[]) => {
      const pair = newClient(...responses);
      return { domains: pair.client.admin.siteDomains, fetchImpl: pair.fetchImpl };
    };
    const { domains, fetchImpl } = sites(
      respond(201, recorded.pendingDomain),
      respond(200, recorded.domainList),
      respond(200, recorded.domain),
      respond(200, recorded.domain),
      respond(200, recorded.domain),
      respond(200, recorded.pendingDomain),
      respond(202, recorded.domain),
      respond(200, recorded.findingList),
      respond(200, recorded.domain),
      respond(200, recorded.incidentList),
      respond(200, recorded.alertDestination),
      respond(200, recorded.alertDestination),
      respond(200, recorded.searchAccount),
      respond(200, recorded.searchPerformance),
      respond(200, recorded.searchConnection),
      respond(204),
      respond(204),
    );
    const item = `${base}/site-domains/${domainUuid}`;
    const acme = { companySlug: "acme" };

    expect(await domains.create({ siteUuid, host: "www.example.com" })).toEqual(recorded.pendingDomain);
    expect((await domains.list(siteUuid, acme)).domains).toHaveLength(2);
    expect((await domains.get(domainUuid)).ownership.attestation?.clientId).toBe("awthy-site-broker");
    expect((await domains.verify(domainUuid)).ownership.verified).toBe(true);
    expect((await domains.attest(domainUuid)).ownership.verifiedBy).toBe("attested");
    expect((await domains.unattest(domainUuid)).ownership.lastCheckFailure).toBe("no TXT record found");
    expect((await domains.requestAudit(domainUuid)).audit.lastSummary?.high).toBe(1);
    const findings = await domains.listFindings(domainUuid, "all");
    expect(findings.findings.map((finding) => finding.rule)).toEqual([SiteRule.TitleMissing, SiteRule.UptimeDown]);
    expect((await domains.setCheckMode(domainUuid, "warm")).checks.openIncident?.failedChecks).toBe(3);
    expect((await domains.listIncidents(domainUuid)).incidents[1]?.resolvedAt).toBe("2026-11-12T01:20:00Z");
    expect((await domains.getAlertDestination(siteUuid)).emailRecipient).toBe("owner@example.com");
    expect((await domains.setAlertDestination({ emailRecipient: "owner@example.com" })).siteUuid).toBe(siteUuid);
    expect((await domains.getSearchAccount()).googleConfigured).toBe(true);
    const performance = await domains.getSearchPerformance(domainUuid, 28);
    expect(performance.sources[0]?.daily[0]?.clicks).toBe(4);
    expect(performance.strikingDistance[0]?.key).toBe("cheap widgets");
    const connection = await domains.connectSearch(domainUuid, "google", { property: "sc-domain:example.com" });
    expect(connection.status).toBe("active");
    await expect(domains.disconnectSearch(domainUuid, "bing")).resolves.toBeUndefined();
    await expect(domains.delete(domainUuid, acme)).resolves.toBeUndefined();

    const calls = fetchImpl.mock.calls.map((_, index) => sent(fetchImpl, index));
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      `POST ${base}/site-domains`,
      `GET ${base}/site-domains?siteUuid=${siteUuid}&companySlug=acme`,
      `GET ${item}`,
      `POST ${item}/verify`,
      `POST ${item}/attestation`,
      `DELETE ${item}/attestation`,
      `POST ${item}/audit`,
      `GET ${item}/findings?state=all`,
      `PUT ${item}/checks`,
      `GET ${item}/incidents`,
      `GET ${base}/site-domains/alert-destination?siteUuid=${siteUuid}`,
      `PUT ${base}/site-domains/alert-destination`,
      `GET ${base}/site-domains/search-account`,
      `GET ${item}/search?days=28`,
      `PUT ${item}/search/google`,
      `DELETE ${item}/search/bing`,
      `DELETE ${item}?companySlug=acme`,
    ]);
    expect(calls[0]?.body).toEqual({ siteUuid, host: "www.example.com" });
    expect(calls[8]?.body).toEqual({ mode: "warm" });
    expect(calls[11]?.body).toEqual({ emailRecipient: "owner@example.com" });
    expect(calls[14]?.body).toEqual({ property: "sc-domain:example.com" });
  });

  it("surfaces the not-verified problem code when an audit is refused", async () => {
    const problem = {
      type: "about:blank",
      title: "Conflict",
      status: 409,
      detail: "site domain: verify the domain before asking for an audit",
      code: SITE_DOMAIN_NOT_VERIFIED_CODE,
    };
    const { client } = newClient(respond(409, problem));

    const refusal = client.admin.siteDomains.requestAudit(domainUuid);

    await expect(refusal).rejects.toBeInstanceOf(CustdRequestError);
    await expect(refusal).rejects.toMatchObject({ status: 409, code: SITE_DOMAIN_NOT_VERIFIED_CODE });
  });
});
