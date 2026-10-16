import { describe, expect, it, vi } from "vitest";
import type { ApplicationPrincipalTarget, AudienceGrantRequest, PrincipalAudiences } from "./index";
import { CustdClient } from "./index";

const target: ApplicationPrincipalTarget = {
  projectId: "project/1",
  environmentId: "env/1",
  directoryId: "dir/1",
  providerSubject: "provider/subject",
};
const base =
  "http://localhost:8080/api/v1/admin/auth-projects/project%2F1/environments/env%2F1/principals/provider%2Fsubject/audiences";
const body: AudienceGrantRequest = { directoryId: "dir/1", audience: "app-web", organisationId: "org-1" };
const options = { owningUserUuid: "owner-1", idempotencyKey: "audience-key" };
function setup(response: unknown) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));
  const client = new CustdClient({ baseUrl: "http://localhost:8080", getToken: () => "token", fetch });
  return { api: client.admin.authProjects, fetch };
}

describe("principal audience entitlement", () => {
  it("lists using provider subject and a directory query", async () => {
    const response: PrincipalAudiences = {
      audienceEntitlementMode: "explicit_grants",
      audiences: [{ audience: "app-web", granted: true, managed: true }],
    };
    const { api, fetch } = setup(response);
    expect(await api.listPrincipalAudiences(target, { owningUserUuid: "owner-1" })).toEqual(response);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${base}?directoryId=dir%2F1`);
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({ "X-Custd-Owning-User-UUID": "owner-1" });
    expect(init.headers["Idempotency-Key"]).toBeUndefined();
  });

  for (const action of ["grant", "revoke"] as const) {
    it(`${action}s only the named audience without a replacement audience`, async () => {
      const response = {
        principalId: "principal-1",
        organisationId: "org-1",
        audience: "app-web",
        granted: action === "grant",
        managed: true,
      };
      const { api, fetch } = setup(response);
      const mutate = action === "grant" ? api.grantPrincipalAudience.bind(api) : api.revokePrincipalAudience.bind(api);
      await expect(mutate(target, body)).rejects.toThrow(/idempotency/i);
      await expect(mutate(target, body, { idempotencyKey: "   " })).rejects.toThrow(/idempotency/i);
      expect(fetch).not.toHaveBeenCalled();
      expect(await mutate(target, body, options)).toEqual(response);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(`${base}/${action}`);
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({ "Idempotency-Key": "audience-key", "X-Custd-Owning-User-UUID": "owner-1" });
      expect(JSON.parse(init.body)).toEqual(body);
    });
  }
});
