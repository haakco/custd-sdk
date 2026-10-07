import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProjectDesiredState } from "./admin-auth-projects";
import { CustdClient } from "./index";

beforeEach(() => {
  vi.restoreAllMocks();
});

const owningUser = "01957abc-0000-7000-8000-0000000000aa";

function mockFetch(body: unknown): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

function newClient(fetchImpl: ReturnType<typeof vi.fn>): CustdClient {
  return new CustdClient({
    baseUrl: "http://localhost:8080",
    getToken: () => "admin-token",
    fetch: fetchImpl as unknown as typeof fetch,
  });
}

function sentRequest(fetchImpl: ReturnType<typeof vi.fn>, call = 0): { url: string; init: RequestInit } {
  const [url, init] = fetchImpl.mock.calls[call] ?? [];
  return { url: String(url), init: init as RequestInit };
}

const authProjectSummary = {
  projectId: "01957abc-0000-7000-8000-000000000001",
  slug: "hosting-eu",
  name: "Hosting EU",
  environmentId: "01957abc-0000-7000-8000-000000000002",
  environmentSlug: "production",
  identityMode: "isolated",
};

// The nested desired-state document a consumer builds from the named types alone.
const desiredState = {
  identityMode: "isolated",
  registrationPolicy: "invite_only",
  loginPaused: false,
  audiences: [
    {
      audience: "hosting-edge",
      publicClient: true,
      redirectUris: ["https://app.example.com/callback"],
      postLogoutRedirectUris: ["https://app.example.com/logout"],
      allowedOrigins: ["https://app.example.com"],
    },
  ],
  profileFields: [{ key: "contact_email", required: true, visibleToApplication: true, editableBy: "user" }],
} satisfies AuthProjectDesiredState;

describe("admin auth projects", () => {
  it("creates a project with the owning user header and idempotency key", async () => {
    const fetchImpl = mockFetch({
      project: authProjectSummary,
      operationId: "op-1",
      replayed: false,
      runtimeReady: true,
    });
    const client = newClient(fetchImpl);

    const creation = await client.admin.authProjects.createProject(
      { slug: "hosting-eu", name: "Hosting EU", environmentSlug: "production", identityMode: "isolated" },
      { owningUserUuid: owningUser, idempotencyKey: "idem-1" },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer admin-token",
      "Idempotency-Key": "idem-1",
      "X-Custd-Owning-User-UUID": owningUser,
    });
    expect(JSON.parse(String(init.body))).toEqual({
      slug: "hosting-eu",
      name: "Hosting EU",
      environmentSlug: "production",
      identityMode: "isolated",
    });
    expect(creation.operationId).toBe("op-1");
    expect(creation.replayed).toBe(false);
    expect(creation.runtimeReady).toBe(true);
    expect(creation.project.environmentId).toBe("01957abc-0000-7000-8000-000000000002");
    expect(creation.project.identityMode).toBe("isolated");
  });

  it("lists projects with the paging cursor", async () => {
    const fetchImpl = mockFetch({ projects: [authProjectSummary], nextAfter: "cursor-2" });
    const client = newClient(fetchImpl);

    const page = await client.admin.authProjects.listProjects("cursor-1", { owningUserUuid: owningUser });

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects?after=cursor-1");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({ "X-Custd-Owning-User-UUID": owningUser });
    expect(page.projects[0]?.slug).toBe("hosting-eu");
    expect(page.nextAfter).toBe("cursor-2");
  });

  it("adds an environment to a project", async () => {
    const fetchImpl = mockFetch({ ...authProjectSummary, environmentId: "env-2", environmentSlug: "staging" });
    const client = newClient(fetchImpl);

    const environment = await client.admin.authProjects.createEnvironment(
      "project-1",
      { slug: "staging", name: "Staging", identityMode: "isolated" },
      { owningUserUuid: owningUser },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects/project-1/environments");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      slug: "staging",
      name: "Staging",
      identityMode: "isolated",
    });
    expect(environment.environmentSlug).toBe("staging");
  });

  it("lists a principal's sessions", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      sessions: [
        {
          sessionId: "session-1",
          active: true,
          authenticatedAt: "2026-10-01T00:00:00Z",
          authenticatorAssuranceLevel: "aal1",
          expiresAt: "2026-10-01T00:04:30Z",
          issuedAt: "2026-10-01T00:00:00Z",
        },
      ],
    });
    const client = newClient(fetchImpl);

    const inventory = await client.admin.authProjects.listPrincipalSessions(
      "project-1",
      "environment-1",
      "directory-1",
      "subject-1",
      { owningUserUuid: owningUser },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(
      "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1" +
        "/directories/directory-1/principals/subject-1/sessions",
    );
    expect(init.method).toBe("GET");
    expect(inventory.principalId).toBe("principal-1");
    expect(inventory.sessions[0]?.sessionId).toBe("session-1");
    expect(inventory.sessions[0]?.active).toBe(true);
    expect(inventory.sessions[0]?.authenticatorAssuranceLevel).toBe("aal1");
  });

  it("revokes one principal session", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      revoked: 1,
      sessionId: "session-1",
    });
    const client = newClient(fetchImpl);

    const revocation = await client.admin.authProjects.revokePrincipalSession(
      "project-1",
      "environment-1",
      "directory-1",
      "subject-1",
      { sessionId: "session-1" },
      { owningUserUuid: owningUser, idempotencyKey: "idem-2" },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(
      "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1" +
        "/directories/directory-1/principals/subject-1/sessions/revoke",
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Idempotency-Key": "idem-2" });
    expect(JSON.parse(String(init.body))).toEqual({ sessionId: "session-1" });
    expect(revocation.revoked).toBe(1);
    expect(revocation.sessionId).toBe("session-1");
  });

  it("revokes all principal sessions with an explicit confirmation", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      revoked: 3,
    });
    const client = newClient(fetchImpl);

    const revocation = await client.admin.authProjects.revokePrincipalSessions(
      "project-1",
      "environment-1",
      "directory-1",
      "subject-1",
      { confirm: true },
      { owningUserUuid: owningUser, idempotencyKey: "idem-3" },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(
      "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1" +
        "/directories/directory-1/principals/subject-1/sessions/revoke-all",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ confirm: true });
    expect(revocation.revoked).toBe(3);
  });

  it("revokes a principal membership", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      organisationId: "organisation-1",
      removedAt: "2026-10-01T00:00:00Z",
      removed: true,
    });
    const client = newClient(fetchImpl);

    const revocation = await client.admin.authProjects.revokePrincipalMembership(
      "project-1",
      "environment-1",
      "directory-1",
      "subject-1",
      { organisationId: "organisation-1" },
      { owningUserUuid: owningUser },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(
      "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1" +
        "/directories/directory-1/principals/subject-1/memberships/revoke",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ organisationId: "organisation-1" });
    expect(revocation.removed).toBe(true);
    expect(revocation.organisationId).toBe("organisation-1");
  });

  it("rejects a missing idempotency key before sending", async () => {
    const fetchImpl = mockFetch({});
    const client = newClient(fetchImpl);

    await expect(
      client.admin.authProjects.createProject(
        { slug: "hosting-eu", name: "Hosting EU", environmentSlug: "production", identityMode: "isolated" },
        { owningUserUuid: owningUser },
      ),
    ).rejects.toThrow("idempotency key is required");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("omits the owning user header for a human administrator", async () => {
    const fetchImpl = mockFetch({ projects: [] });
    const client = newClient(fetchImpl);

    await client.admin.authProjects.listProjects();

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects");
    expect(init.headers).not.toHaveProperty("X-Custd-Owning-User-UUID");
  });

  it("applies the environment desired state with the owning user header and idempotency key", async () => {
    const fetchImpl = mockFetch({
      id: "op-1",
      kind: "project_auth_config_update",
      status: "applied",
      revision: 7,
      idempotencyKey: "idem-apply",
      appliedAt: "2026-10-07T00:00:00Z",
      replayed: false,
    });
    const client = newClient(fetchImpl);

    const operation = await client.admin.authProjects.applyEnvironmentDesiredState(
      "project-1",
      "environment-1",
      { desiredState, expectedRevision: 6 },
      { owningUserUuid: owningUser, idempotencyKey: "idem-apply" },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/apply");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer admin-token",
      "Idempotency-Key": "idem-apply",
      "X-Custd-Owning-User-UUID": owningUser,
    });
    expect(JSON.parse(String(init.body))).toEqual({ desiredState, expectedRevision: 6 });
    expect(operation.id).toBe("op-1");
    expect(operation.revision).toBe(7);
    expect(operation.replayed).toBe(false);
  });

  it("previews the environment desired state", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      revision: 7,
      changes: [{ field: "desired.audiences", before: "[]", after: "[hosting-edge]" }],
      sideEffects: ["client_registration"],
      noOp: false,
    });
    const client = newClient(fetchImpl);

    const preview = await client.admin.authProjects.previewEnvironmentDesiredState(
      "project-1",
      "environment-1",
      { desiredState, expectedRevision: 6 },
      { owningUserUuid: owningUser },
    );

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/preview");
    expect(init.method).toBe("POST");
    expect(preview.changes?.[0]?.field).toBe("desired.audiences");
    expect(preview.sideEffects).toEqual(["client_registration"]);
    expect(preview.noOp).toBe(false);
  });

  it("reads the audience binding back from environment status", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      revision: 7,
      desired: desiredState,
      reconciled: true,
      reconcileNote: "",
      loginReady: false,
      loginNote: "",
      clientSync: {
        clientIds: ["custd-app-environment-1-hosting-edge"],
        revision: 7,
        checkedAt: "2026-10-07T00:00:00Z",
        current: true,
        registrations: [{ audience: "hosting-edge", clientId: "custd-app-environment-1-hosting-edge", observed: true }],
      },
    });
    const client = newClient(fetchImpl);

    const status = await client.admin.authProjects.getEnvironmentStatus("project-1", "environment-1", {
      owningUserUuid: owningUser,
    });

    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1/status");
    expect(init.method).toBe("GET");
    expect(status.environmentId).toBe("environment-1");
    expect(status.desired.audiences?.[0]?.audience).toBe("hosting-edge");
    expect(status.clientSync?.registrations?.[0]?.clientId).toBe("custd-app-environment-1-hosting-edge");
  });

  it("rejects a missing idempotency key on apply before sending", async () => {
    const fetchImpl = mockFetch({});
    const client = newClient(fetchImpl);

    await expect(
      client.admin.authProjects.applyEnvironmentDesiredState(
        "project-1",
        "environment-1",
        { desiredState, expectedRevision: 6 },
        { owningUserUuid: owningUser },
      ),
    ).rejects.toThrow("idempotency key is required");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
