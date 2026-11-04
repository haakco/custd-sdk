import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProjectDesiredState } from "./admin-auth-projects";
import { AuthProjectRealmNotConvergedError, AuthProjectRealmProvisionError } from "./admin-auth-projects";
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

function mockFetchSequence(bodies: unknown[]): ReturnType<typeof vi.fn> {
  const impl = vi.fn();
  bodies.forEach((body) => {
    impl.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
    );
  });
  return impl;
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

const base = "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1";
const options = { owningUserUuid: owningUser };

describe("auth-project directory and configuration surface", () => {
  it("reads the environment capability", async () => {
    const fetchImpl = mockFetch({
      identityModes: ["isolated", "shared"],
      registrationPolicies: ["invite_only"],
      profileFieldKeys: ["contact_email"],
      audienceConstraints: "one audience per environment",
      subjectUniqueness: "per environment",
    });
    const capability = await newClient(fetchImpl).admin.authProjects.getEnvironmentCapability(
      "project-1",
      "environment-1",
      options,
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/capability`);
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({ "X-Custd-Owning-User-UUID": owningUser });
    expect(capability.identityModes?.[1]).toBe("shared");
    expect(capability.subjectUniqueness).toBe("per environment");
  });

  it("lists directories with capacity and store state", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      revision: 4,
      directories: [
        { poolId: "pool-1", poolSlug: "primary", state: "ready", slotRef: "store-1", revision: 4, attemptCount: 1 },
      ],
      ready: true,
      capacity: { declared: 3, inUse: 1, free: 2 },
    });
    const status = await newClient(fetchImpl).admin.authProjects.listDirectories("project-1", "environment-1", options);
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/directories`);
    expect(init.method).toBe("GET");
    expect(status.capacity.free).toBe(2);
    expect(status.directories?.[0]?.slotRef).toBe("store-1");
  });

  it.each(["enable", "pause", "resume", "release"] as const)("acts on a directory with %s", async (action) => {
    const fetchImpl = mockFetch({
      id: "op-1",
      kind: "directory_enable",
      status: "applied",
      revision: 5,
      idempotencyKey: "idem-dir",
      appliedAt: "2026-10-16T00:00:00Z",
      replayed: false,
    });
    const operation = await newClient(fetchImpl).admin.authProjects.actOnDirectory(
      "project-1",
      "environment-1",
      action,
      { poolId: "pool-1", expectedRevision: 4 },
      { owningUserUuid: owningUser, idempotencyKey: "idem-dir" },
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/directories/${action}`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ poolId: "pool-1", expectedRevision: 4 });
    expect(operation.revision).toBe(5);
  });

  it("refuses an unknown directory action before transport", async () => {
    const fetchImpl = mockFetch({});
    await expect(
      newClient(fetchImpl).admin.authProjects.actOnDirectory(
        "project-1",
        "environment-1",
        "destroy" as "enable",
        { poolId: "pool-1", expectedRevision: 0 },
        { owningUserUuid: owningUser, idempotencyKey: "idem-dir" },
      ),
    ).rejects.toThrow("not one of enable, pause, resume or release");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("lists environment organisations", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      organisations: [{ organisationId: "org-1", slug: "acme", name: "Acme", identityPoolId: "pool-1" }],
    });
    const list = await newClient(fetchImpl).admin.authProjects.listEnvironmentOrganisations(
      "project-1",
      "environment-1",
      options,
    );
    const { url } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/organisations`);
    expect(list.organisations?.[0]?.identityPoolId).toBe("pool-1");
  });

  it("reconciles environment clients", async () => {
    const fetchImpl = mockFetch({
      environmentId: "environment-1",
      revision: 6,
      checkedAt: "2026-10-16T00:00:00Z",
      superseded: false,
      clients: [{ audience: "hosting-edge", clientId: "custd-app-environment-1-hosting-edge", action: "created" }],
    });
    const report = await newClient(fetchImpl).admin.authProjects.reconcileEnvironmentClients(
      "project-1",
      "environment-1",
      { expectedRevision: 5 },
      { owningUserUuid: owningUser, idempotencyKey: "idem-reconcile" },
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/clients/reconcile`);
    expect(JSON.parse(String(init.body))).toEqual({ expectedRevision: 5 });
    expect(report.clients?.[0]?.action).toBe("created");
  });
});

describe("auth-project invitations", () => {
  it("lists invitations", async () => {
    const fetchImpl = mockFetch({
      invitations: [
        {
          invitationId: "inv-1",
          email: "person@example.com",
          membershipRole: "member",
          poolId: "pool-1",
          organisationId: "org-1",
          expiresAt: "2026-10-20T00:00:00Z",
          createdAt: "2026-10-16T00:00:00Z",
          state: "open",
          acceptedPrincipalId: null,
        },
        {
          invitationId: "inv-accepted",
          email: "person@example.com",
          membershipRole: "member",
          poolId: "pool-1",
          organisationId: "org-1",
          expiresAt: "2026-10-20T00:00:00Z",
          createdAt: "2026-10-16T00:00:00Z",
          state: "accepted",
          acceptedPrincipalId: "017f22e2-79b0-7f4a-8f90-ec7c7c502334",
        },
      ],
    });
    const list = await newClient(fetchImpl).admin.authProjects.listInvitations("project-1", "environment-1", options);
    const { url } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/invitations`);
    expect(list.invitations?.[0]?.state).toBe("open");
    expect(list.invitations?.[0]?.acceptedPrincipalId).toBeNull();
    expect(list.invitations?.[1]?.acceptedPrincipalId).toBe("017f22e2-79b0-7f4a-8f90-ec7c7c502334");
  });

  it("issues an invitation and returns the one-time link", async () => {
    const fetchImpl = mockFetch({
      invitation: {
        invitationId: "inv-1",
        email: "person@example.com",
        membershipRole: "member",
        poolId: "pool-1",
        organisationId: "org-1",
        expiresAt: "2026-10-20T00:00:00Z",
        createdAt: "2026-10-16T00:00:00Z",
        state: "open",
        delivered: true,
      },
      inviteUrl: "https://auth.example.com/invite/abc",
      replayed: false,
    });
    const issued = await newClient(fetchImpl).admin.authProjects.issueInvitation(
      "project-1",
      "environment-1",
      {
        poolId: "pool-1",
        organisationId: "org-1",
        email: "person@example.com",
        membershipRole: "member",
        expiresInSeconds: 86400,
      },
      { owningUserUuid: owningUser, idempotencyKey: "idem-invite" },
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/invitations`);
    expect(init.method).toBe("POST");
    expect(issued.inviteUrl).toBe("https://auth.example.com/invite/abc");
    expect(issued.invitation.delivered).toBe(true);
  });

  it("redelivers an invitation", async () => {
    const fetchImpl = mockFetch({
      invitation: {
        invitationId: "inv-1",
        email: "p@example.com",
        membershipRole: "member",
        poolId: "pool-1",
        organisationId: "org-1",
        expiresAt: "x",
        createdAt: "y",
        state: "open",
      },
      inviteUrl: "https://auth.example.com/invite/def",
      replayed: false,
    });
    const issued = await newClient(fetchImpl).admin.authProjects.redeliverInvitation(
      "project-1",
      "environment-1",
      { invitationId: "inv-1" },
      { owningUserUuid: owningUser, idempotencyKey: "idem-redeliver" },
    );
    const { url } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/invitations/redeliver`);
    expect(issued.inviteUrl).toBe("https://auth.example.com/invite/def");
  });

  it("revokes an invitation", async () => {
    const fetchImpl = mockFetch({
      invitationId: "inv-1",
      email: "p@example.com",
      membershipRole: "member",
      poolId: "pool-1",
      organisationId: "org-1",
      expiresAt: "x",
      createdAt: "y",
      state: "revoked",
    });
    const view = await newClient(fetchImpl).admin.authProjects.revokeInvitation(
      "project-1",
      "environment-1",
      { invitationId: "inv-1" },
      { owningUserUuid: owningUser, idempotencyKey: "idem-revoke" },
    );
    const { url } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/invitations/revoke`);
    expect(view.state).toBe("revoked");
  });

  it.each(["issueInvitation", "redeliverInvitation", "revokeInvitation"] as const)(
    "refuses %s without an idempotency key before transport",
    async (method) => {
      const fetchImpl = mockFetch({});
      const client = newClient(fetchImpl).admin.authProjects;
      const invoke = () =>
        method === "issueInvitation"
          ? client.issueInvitation("project-1", "environment-1", {
              poolId: "pool-1",
              organisationId: "org-1",
              email: "e",
              membershipRole: "member",
              expiresInSeconds: 1,
            })
          : method === "redeliverInvitation"
            ? client.redeliverInvitation("project-1", "environment-1", { invitationId: "inv-1" })
            : client.revokeInvitation("project-1", "environment-1", { invitationId: "inv-1" });
      await expect(invoke()).rejects.toThrow("idempotency key is required");
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
});

describe("auth-project principal profile and memberships", () => {
  const target = {
    projectId: "project-1",
    environmentId: "environment-1",
    directoryId: "directory-1",
    providerSubject: "subject-1",
  };
  const principalPath = `${base}/directories/directory-1/principals/subject-1`;

  it("reads a principal's profile", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      fields: [
        {
          fieldKey: "contact_email",
          value: "person@example.com",
          present: true,
          required: true,
          editableBy: "user",
          editable: false,
        },
      ],
      missingRequired: ["display_name"],
    });
    const profile = await newClient(fetchImpl).admin.authProjects.getPrincipalProfile(target, options);
    const { url } = sentRequest(fetchImpl);
    expect(url).toBe(`${principalPath}/profile`);
    expect(profile.fields?.[0]?.editable).toBe(false);
    expect(profile.missingRequired).toEqual(["display_name"]);
  });

  it("sets a principal's profile", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      fields: [],
      missingRequired: [],
    });
    await newClient(fetchImpl).admin.authProjects.setPrincipalProfile(
      target,
      { values: [{ fieldKey: "display_name", value: "Ada" }] },
      { owningUserUuid: owningUser, idempotencyKey: "idem-profile" },
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${principalPath}/profile`);
    expect(JSON.parse(String(init.body))).toEqual({ values: [{ fieldKey: "display_name", value: "Ada" }] });
  });

  it("lists a principal's memberships", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      environmentId: "environment-1",
      directoryId: "directory-1",
      principalId: "principal-1",
      memberships: [{ organisationId: "org-1", organisationSlug: "acme", organisationName: "Acme", role: "member" }],
    });
    const context = await newClient(fetchImpl).admin.authProjects.listPrincipalMemberships(target, options);
    const { url } = sentRequest(fetchImpl);
    expect(url).toBe(`${principalPath}/memberships`);
    expect(context.memberships?.[0]?.role).toBe("member");
  });
});

describe("auth-project deletion", () => {
  it("deletes a project with the confirmation slug", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      slug: "hosting-eu",
      name: "Hosting EU",
      released: {
        environments: 2,
        directories: 2,
        organisations: 2,
        memberships: 1,
        invitations: 3,
        audienceBindings: 1,
        operations: 4,
      },
    });
    const deletion = await newClient(fetchImpl).admin.authProjects.deleteProject(
      "project-1",
      { confirmSlug: "hosting-eu" },
      options,
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe("http://localhost:8080/api/v1/admin/auth-projects/project-1/delete");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ confirmSlug: "hosting-eu" });
    expect(deletion.released.environments).toBe(2);
  });

  it("deletes one environment without touching siblings", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      projectSlug: "hosting-eu",
      environmentId: "environment-1",
      slug: "staging",
      name: "Staging",
      released: {
        directories: 1,
        organisations: 1,
        memberships: 0,
        invitations: 1,
        audienceBindings: 1,
        operations: 2,
        profileValues: 3,
      },
    });
    const deletion = await newClient(fetchImpl).admin.authProjects.deleteEnvironment(
      "project-1",
      "environment-1",
      { confirmSlug: "staging" },
      options,
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/delete`);
    expect(init.method).toBe("POST");
    expect(deletion.projectSlug).toBe("hosting-eu");
    expect(deletion.released.profileValues).toBe(3);
  });

  it("offboards one environment with the retained-resource receipt", async () => {
    const fetchImpl = mockFetch({
      projectId: "project-1",
      projectSlug: "hosting-eu",
      environmentId: "environment-1",
      slug: "staging",
      name: "Staging",
      authorityWithdrawn: true,
      loginPaused: true,
      revision: 8,
      clientCleanup: { status: "complete", clientsRemoved: 2 },
      retained: {
        directories: 1,
        organisations: 1,
        memberships: 3,
        invitations: 4,
        profileValues: 5,
        reservedSlots: 1,
      },
    });
    const offboarding = await newClient(fetchImpl).admin.authProjects.offboardEnvironment(
      "project-1",
      "environment-1",
      { confirmSlug: "staging" },
      options,
    );
    const { url, init } = sentRequest(fetchImpl);
    expect(url).toBe(`${base}/offboard`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ confirmSlug: "staging" });
    expect(init.headers).toMatchObject({ "X-Custd-Owning-User-UUID": owningUser });
    expect(init.headers).not.toHaveProperty("Idempotency-Key");
    expect(offboarding.clientCleanup.status).toBe("complete");
    expect(offboarding.retained.reservedSlots).toBe(1);
  });
});

describe("auth-project realm provision", () => {
  const desiredState = {
    identityMode: "isolated",
    registrationPolicy: "invite_only",
    loginPaused: false,
    audiences: [],
    profileFields: [],
  } satisfies AuthProjectDesiredState;

  const realmRequest = {
    desiredStateRequest: { desiredState, expectedRevision: 0 },
    directoryPoolId: "pool-1",
  };

  // realmWireServer is a stateful stand-in for the admin API's revision rules, so a
  // provision test exercises the real ordering contract instead of a permissive fixed
  // response. It enforces what the service enforces: the first apply inserts revision
  // 1, a directory transition advances the revision it names, a reconcile records its
  // observation at the current revision without advancing it, status is reconciled
  // only when that observation describes the current revision, and a repeated
  // Idempotency-Key returns the recorded response instead of writing again.
  function realmWireServer() {
    const state = {
      revision: 0,
      observedAt: 0,
      operations: new Map<string, unknown>(),
      requests: [] as { url: string; method: string; key: string; body: unknown }[],
      statusFailures: 0,
      skipObservation: false,
    };
    let operationCount = 0;
    const respond = (body: unknown, status = 200): Response =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    const operation = (kind: string, key: string): unknown => ({
      id: `op-${++operationCount}`,
      kind,
      status: "applied",
      revision: state.revision,
      idempotencyKey: key,
      appliedAt: "2026-10-16T00:00:00Z",
      replayed: false,
    });

    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const key = headers["Idempotency-Key"] ?? "";
      const body = init?.body === undefined ? undefined : (JSON.parse(String(init.body)) as Record<string, unknown>);
      state.requests.push({ url, method, key, body });

      if (key !== "" && (key.length < 8 || key.length > 128)) {
        return respond({ title: "invalid_idempotency_key" }, 400);
      }

      if (method === "POST" && url.endsWith("/apply")) {
        const recorded = state.operations.get(key);
        if (recorded !== undefined) return respond(recorded);
        const expected = Number(body?.expectedRevision ?? -1);
        if (state.revision === 0 && expected === 0) state.revision = 1;
        else if (state.revision !== 0 && expected === state.revision) state.revision += 1;
        else return respond({ title: "revision_conflict" }, 409);
        const recordedOperation = operation("project_auth_config_update", key);
        state.operations.set(key, recordedOperation);
        return respond(recordedOperation);
      }

      if (method === "POST" && url.endsWith("/directories/enable")) {
        const recorded = state.operations.get(key);
        if (recorded !== undefined) return respond(recorded);
        if (Number(body?.expectedRevision ?? -1) !== state.revision) {
          return respond({ title: "revision_conflict" }, 409);
        }
        state.revision += 1;
        const recordedOperation = operation("directory_enable", key);
        state.operations.set(key, recordedOperation);
        return respond(recordedOperation);
      }

      if (method === "POST" && url.endsWith("/clients/reconcile")) {
        const recorded = state.operations.get(key);
        if (recorded !== undefined) return respond(recorded);
        if (Number(body?.expectedRevision ?? -1) !== state.revision) {
          return respond({ title: "client_sync_stale" }, 409);
        }
        if (!state.skipObservation) state.observedAt = state.revision;
        const report = {
          environmentId: "environment-1",
          revision: state.revision,
          checkedAt: "2026-10-16T00:00:00Z",
          superseded: false,
          clients: [],
        };
        state.operations.set(key, report);
        return respond(report);
      }

      if (method === "GET" && url.endsWith("/status")) {
        if (state.statusFailures > 0) {
          state.statusFailures -= 1;
          return respond({ title: "status_unavailable" }, 500);
        }
        const reconciled = state.observedAt !== 0 && state.observedAt === state.revision;
        return respond({
          projectId: "project-1",
          environmentId: "environment-1",
          revision: state.revision,
          desired: desiredState,
          reconciled,
          reconcileNote: reconciled ? "" : "provider observation is stale",
          loginReady: false,
          loginNote: "",
          clientSync: null,
        });
      }

      return respond({ title: "not_found" }, 404);
    });

    return { fetchImpl, state };
  }

  it("orders apply, directory enable, reconcile and status on the server's revisions", async () => {
    const { fetchImpl, state } = realmWireServer();
    const receipt = await newClient(fetchImpl).admin.authProjects.provisionRealm(
      "project-1",
      "environment-1",
      realmRequest,
      { owningUserUuid: owningUser, idempotencyKey: "realm-provision-1" },
    );

    expect(state.revision).toBe(2);
    expect(state.observedAt).toBe(2);
    expect(state.requests).toHaveLength(4);
    const [apply, directory, reconcile, status] = state.requests;
    expect(apply.url).toBe(`${base}/apply`);
    expect(directory.url).toBe(`${base}/directories/enable`);
    expect(reconcile.url).toBe(`${base}/clients/reconcile`);
    expect(status.url).toBe(`${base}/status`);
    expect(apply.key).toBe("realm-provision-1:apply");
    expect(directory.key).toBe("realm-provision-1:directory-enable");
    expect(reconcile.key).toBe("realm-provision-1:client-reconcile");
    expect(status.key).toBe("");
    expect(directory.body).toEqual({ poolId: "pool-1", expectedRevision: 1 });
    expect(reconcile.body).toEqual({ expectedRevision: 2 });
    expect(receipt.failedStep).toBeUndefined();
    expect(receipt.apply?.revision).toBe(1);
    expect(receipt.directory?.revision).toBe(2);
    expect(receipt.reconcile?.revision).toBe(2);
    expect(receipt.status?.reconciled).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("resumes with the same base key after a late status failure without extra writes", async () => {
    const { fetchImpl, state } = realmWireServer();
    state.statusFailures = 1;
    const client = newClient(fetchImpl).admin.authProjects;
    const options = { owningUserUuid: owningUser, idempotencyKey: "realm-provision-2" };

    const first = await client
      .provisionRealm("project-1", "environment-1", realmRequest, options)
      .catch((caught: unknown) => caught);
    expect(first).toBeInstanceOf(AuthProjectRealmProvisionError);
    const failure = first as AuthProjectRealmProvisionError;
    expect(failure.failedStep).toBe("status");
    expect(failure.receipt.reconcile?.revision).toBe(2);
    expect(state.revision).toBe(2);

    const second = await client.provisionRealm("project-1", "environment-1", realmRequest, options);
    expect(second.failedStep).toBeUndefined();
    expect(second.status?.reconciled).toBe(true);
    expect(state.requests).toHaveLength(8);
    expect(state.revision).toBe(2);
  });

  it("refuses to report success while the realm is not converged", async () => {
    const { fetchImpl, state } = realmWireServer();
    state.skipObservation = true;
    const error = await newClient(fetchImpl)
      .admin.authProjects.provisionRealm("project-1", "environment-1", realmRequest, {
        owningUserUuid: owningUser,
        idempotencyKey: "realm-provision-3",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AuthProjectRealmProvisionError);
    const failure = error as AuthProjectRealmProvisionError;
    expect(failure.failedStep).toBe("status");
    expect(failure.receipt.status?.reconciled).toBe(false);
    expect(failure.cause).toBeInstanceOf(AuthProjectRealmNotConvergedError);
  });

  it("reports the failed step and keeps completed steps", async () => {
    const fetchImpl = mockFetchSequence([
      {
        id: "op-apply",
        kind: "project_auth_config_update",
        status: "applied",
        revision: 1,
        idempotencyKey: "provision-4:apply",
        appliedAt: "x",
        replayed: false,
      },
    ]);
    fetchImpl.mockResolvedValueOnce(
      new Response("{}", { status: 500, headers: { "content-type": "application/json" } }),
    );
    const error = await newClient(fetchImpl)
      .admin.authProjects.provisionRealm("project-1", "environment-1", realmRequest, {
        owningUserUuid: owningUser,
        idempotencyKey: "provision-4",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AuthProjectRealmProvisionError);
    const failure = error as AuthProjectRealmProvisionError;
    expect(failure.failedStep).toBe("directory_enable");
    expect(failure.receipt.apply?.id).toBe("op-apply");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("refuses a base idempotency key outside the 8..111 bound before transport", async () => {
    for (const key of ["k".repeat(7), "k".repeat(112)]) {
      const { fetchImpl } = realmWireServer();
      await expect(
        newClient(fetchImpl).admin.authProjects.provisionRealm("project-1", "environment-1", realmRequest, {
          owningUserUuid: owningUser,
          idempotencyKey: key,
        }),
      ).rejects.toThrow("base idempotency key");
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("accepts the 111-character boundary base with every derived key legal", async () => {
    const { fetchImpl, state } = realmWireServer();
    const receipt = await newClient(fetchImpl).admin.authProjects.provisionRealm(
      "project-1",
      "environment-1",
      realmRequest,
      { owningUserUuid: owningUser, idempotencyKey: "k".repeat(111) },
    );
    expect(receipt.failedStep).toBeUndefined();
    for (const request of state.requests) {
      if (request.key === "") continue;
      expect(request.key.length).toBeGreaterThanOrEqual(8);
      expect(request.key.length).toBeLessThanOrEqual(128);
    }
  });
});
