<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuthProject\Capability;
use HaakCo\Custd\Admin\AuthProject\ClientSyncReport;
use HaakCo\Custd\Admin\AuthProject\ClientSyncRequest;
use HaakCo\Custd\Admin\AuthProject\DesiredState;
use HaakCo\Custd\Admin\AuthProject\DesiredStateRequest;
use HaakCo\Custd\Admin\AuthProject\DirectoryRequest;
use HaakCo\Custd\Admin\AuthProject\DirectoryStatus;
use HaakCo\Custd\Admin\AuthProject\EnvironmentDeletion;
use HaakCo\Custd\Admin\AuthProject\EnvironmentDeletionRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentOffboardRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentOffboarding;
use HaakCo\Custd\Admin\AuthProject\EnvironmentOrganisationList;
use HaakCo\Custd\Admin\AuthProject\Invitation;
use HaakCo\Custd\Admin\AuthProject\InvitationIssueRequest;
use HaakCo\Custd\Admin\AuthProject\InvitationIssued;
use HaakCo\Custd\Admin\AuthProject\InvitationListResponse;
use HaakCo\Custd\Admin\AuthProject\InvitationRedeliveryRequest;
use HaakCo\Custd\Admin\AuthProject\InvitationRevocationRequest;
use HaakCo\Custd\Admin\AuthProject\Operation;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalProfile;
use HaakCo\Custd\Admin\AuthProject\ApplicationPrincipalTarget;
use HaakCo\Custd\Admin\AuthProject\ApplicationMembershipContext;
use HaakCo\Custd\Admin\AuthProject\ApplicationProfileValue;
use HaakCo\Custd\Admin\AuthProject\ProfileValuesRequest;
use HaakCo\Custd\Admin\AuthProject\ProjectDeletion;
use HaakCo\Custd\Admin\AuthProject\ProjectDeletionRequest;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionException;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionRequest;
use HaakCo\Custd\Admin\AuthProject\RealmProvisionStep;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AuthProjectSurfaceTest extends TestCase
{
    private const OWNING_USER = "01957abc-0000-7000-8000-0000000000aa";

    private const OWNING_USER_HEADER = "X-Custd-Owning-User-UUID";

    private const BASE = "http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1";

    /** @return array<string, mixed> */
    private function desiredState(): array
    {
        return [
            "identityMode" => "isolated",
            "registrationPolicy" => "invite_only",
            "loginPaused" => false,
            "audiences" => [],
            "profileFields" => [],
        ];
    }

    /**
     * Answers each call with the queued response, recording every request.
     *
     * @param  list<array{status?: int, body?: mixed}>  $queue
     * @param  list<array<string, mixed>>  $calls
     */
    private function clientWithQueue(array $queue, array &$calls): CustdClient
    {
        $index = 0;

        return new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (
                string $method,
                string $url,
                ?array $body,
                string $token,
                array $headers = [],
            ) use (&$calls, &$index, $queue): array {
                $calls[] = compact("method", "url", "body", "token", "headers");
                $entry = $queue[$index] ?? ["status" => 200, "body" => []];
                $index++;

                return [
                    "status" => $entry["status"] ?? 200,
                    "body" => json_encode($entry["body"] ?? [], flags: JSON_THROW_ON_ERROR),
                ];
            },
        ]);
    }

    /**
     * @param  array<string, mixed>  $response
     * @param  list<array<string, mixed>>  $calls
     */
    private function clientWithResponse(array $response, array &$calls): CustdClient
    {
        return $this->clientWithQueue([["body" => $response]], $calls);
    }

    public function testReadsCapability(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "identityModes" => ["isolated", "shared"],
            "registrationPolicies" => ["invite_only"],
            "profileFieldKeys" => ["contact_email"],
            "audienceConstraints" => "one audience per environment",
            "subjectUniqueness" => "per environment",
        ], $calls);

        $capability = $client->adminAuthProjects()->getEnvironmentCapability(
            "project-1",
            "environment-1",
            new RequestOptions(owningUserUuid: self::OWNING_USER),
        );

        self::assertInstanceOf(Capability::class, $capability);
        self::assertSame(["GET"], array_column($calls, "method"));
        self::assertSame([self::BASE . "/capability"], array_column($calls, "url"));
        self::assertSame(self::OWNING_USER, $calls[0]["headers"][self::OWNING_USER_HEADER]);
        self::assertSame("shared", $capability->identityModes[1]);
    }

    public function testListsDirectoriesWithCapacity(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "projectId" => "project-1",
            "environmentId" => "environment-1",
            "revision" => 4,
            "directories" => [[
                "poolId" => "pool-1",
                "poolSlug" => "primary",
                "state" => "ready",
                "slotRef" => "store-1",
                "revision" => 4,
                "attemptCount" => 1,
            ]],
            "ready" => true,
            "capacity" => ["declared" => 3, "inUse" => 1, "free" => 2],
        ], $calls);

        $status = $client->adminAuthProjects()->listDirectories("project-1", "environment-1");

        self::assertInstanceOf(DirectoryStatus::class, $status);
        self::assertSame([self::BASE . "/directories"], array_column($calls, "url"));
        self::assertSame(2, $status->capacity->free);
        self::assertSame("store-1", $status->directories[0]->slotRef);
    }

    public function testActsOnDirectoryWithTypedAction(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "id" => "op-1",
            "kind" => "directory_enable",
            "status" => "applied",
            "revision" => 5,
            "idempotencyKey" => "idem-dir",
            "appliedAt" => "2026-10-16T00:00:00Z",
            "replayed" => false,
        ], $calls);

        $operation = $client->adminAuthProjects()->actOnDirectory(
            "project-1",
            "environment-1",
            \HaakCo\Custd\Admin\AuthProjectClient::DIRECTORY_ENABLE,
            new DirectoryRequest("pool-1", 4),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-dir"),
        );

        self::assertInstanceOf(Operation::class, $operation);
        self::assertSame([self::BASE . "/directories/enable"], array_column($calls, "url"));
        self::assertSame("idem-dir", $calls[0]["headers"]["Idempotency-Key"]);
        self::assertSame(["poolId" => "pool-1", "expectedRevision" => 4], $calls[0]["body"]);
        self::assertSame(5, $operation->revision);
    }

    public function testRejectsUnknownDirectoryAction(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([], $calls);

        $this->expectException(\InvalidArgumentException::class);
        try {
            $client->adminAuthProjects()->actOnDirectory(
                "project-1",
                "environment-1",
                "destroy",
                new DirectoryRequest("pool-1", 0),
                new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-dir"),
            );
        } finally {
            self::assertSame([], $calls);
        }
    }

    public function testListsEnvironmentOrganisations(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "projectId" => "project-1",
            "environmentId" => "environment-1",
            "organisations" => [[
                "organisationId" => "org-1",
                "slug" => "acme",
                "name" => "Acme",
                "identityPoolId" => "pool-1",
            ]],
        ], $calls);

        $list = $client->adminAuthProjects()->listEnvironmentOrganisations("project-1", "environment-1");

        self::assertInstanceOf(EnvironmentOrganisationList::class, $list);
        self::assertSame([self::BASE . "/organisations"], array_column($calls, "url"));
        self::assertSame("pool-1", $list->organisations[0]->identityPoolId);
    }

    public function testReconcilesEnvironmentClients(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "environmentId" => "environment-1",
            "revision" => 6,
            "checkedAt" => "2026-10-16T00:00:00Z",
            "superseded" => false,
            "clients" => [[
                "audience" => "hosting-edge",
                "clientId" => "custd-app-environment-1-hosting-edge",
                "action" => "created",
            ]],
        ], $calls);

        $report = $client->adminAuthProjects()->reconcileEnvironmentClients(
            "project-1",
            "environment-1",
            new ClientSyncRequest(5),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-reconcile"),
        );

        self::assertInstanceOf(ClientSyncReport::class, $report);
        self::assertSame([self::BASE . "/clients/reconcile"], array_column($calls, "url"));
        self::assertSame(["expectedRevision" => 5], $calls[0]["body"]);
        self::assertSame("created", $report->clients[0]->action);
    }

    public function testReconcilesEnvironmentClientsWithZeroRegistrations(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "environmentId" => "environment-1",
            "revision" => 2,
            "checkedAt" => "2026-10-16T00:00:00Z",
            "superseded" => false,
            "clients" => null,
        ], $calls);

        $report = $client->adminAuthProjects()->reconcileEnvironmentClients(
            "project-1",
            "environment-1",
            new ClientSyncRequest(1),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-reconcile-empty"),
        );

        self::assertSame([], $report->clients);
        self::assertSame(2, $report->revision);
        self::assertSame([self::BASE . "/clients/reconcile"], array_column($calls, "url"));
    }

    /** @return array<string, mixed> */
    private function invitation(): array
    {
        return [
            "invitationId" => "inv-1",
            "email" => "person@example.com",
            "membershipRole" => "member",
            "poolId" => "pool-1",
            "organisationId" => "org-1",
            "expiresAt" => "2026-10-20T00:00:00Z",
            "createdAt" => "2026-10-16T00:00:00Z",
            "state" => "open",
        ];
    }

    public function testInvitationLifecycle(): void
    {
        $calls = [];
        $client = $this->clientWithQueue([
            ["body" => ["invitations" => [
                [...$this->invitation(), "acceptedPrincipalId" => null],
                [...$this->invitation(), "invitationId" => "inv-accepted", "state" => "accepted", "acceptedPrincipalId" => "017f22e2-79b0-7f4a-8f90-ec7c7c502334"],
            ]]],
            ["body" => ["invitation" => [...$this->invitation(), "delivered" => true], "inviteUrl" => "https://auth.example.com/invite/abc", "replayed" => false]],
            ["body" => ["invitation" => $this->invitation(), "inviteUrl" => "https://auth.example.com/invite/def", "replayed" => false]],
            ["body" => [...$this->invitation(), "state" => "revoked"]],
        ], $calls);
        $projects = $client->adminAuthProjects();

        $listed = $projects->listInvitations("project-1", "environment-1");
        $issued = $projects->issueInvitation(
            "project-1",
            "environment-1",
            new InvitationIssueRequest("pool-1", "org-1", "person@example.com", "member", 86400),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-invite"),
        );
        $redelivered = $projects->redeliverInvitation(
            "project-1",
            "environment-1",
            new InvitationRedeliveryRequest("inv-1"),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-redeliver"),
        );
        $revoked = $projects->revokeInvitation(
            "project-1",
            "environment-1",
            new InvitationRevocationRequest("inv-1"),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-revoke"),
        );

        self::assertInstanceOf(InvitationListResponse::class, $listed);
        self::assertInstanceOf(InvitationIssued::class, $issued);
        self::assertInstanceOf(InvitationIssued::class, $redelivered);
        self::assertInstanceOf(Invitation::class, $revoked);
        self::assertSame(
            [self::BASE . "/invitations", self::BASE . "/invitations", self::BASE . "/invitations/redeliver", self::BASE . "/invitations/revoke"],
            array_column($calls, "url"),
        );
        self::assertSame("open", $listed->invitations[0]->state);
        self::assertNull($listed->invitations[0]->acceptedPrincipalId);
        self::assertSame("017f22e2-79b0-7f4a-8f90-ec7c7c502334", $listed->invitations[1]->acceptedPrincipalId);
        self::assertTrue($issued->invitation->delivered);
        self::assertSame("https://auth.example.com/invite/def", $redelivered->inviteUrl);
        self::assertSame("revoked", $revoked->state);
    }

    public function testPrincipalProfileAndMemberships(): void
    {
        $calls = [];
        $client = $this->clientWithQueue([
            ["body" => [
                "projectId" => "project-1",
                "environmentId" => "environment-1",
                "directoryId" => "directory-1",
                "principalId" => "principal-1",
                "fields" => [[
                    "fieldKey" => "contact_email",
                    "value" => "person@example.com",
                    "present" => true,
                    "required" => true,
                    "editableBy" => "user",
                    "editable" => false,
                ]],
                "missingRequired" => ["display_name"],
            ]],
            ["body" => ["projectId" => "project-1", "environmentId" => "environment-1", "directoryId" => "directory-1", "principalId" => "principal-1", "fields" => [], "missingRequired" => []]],
            ["body" => [
                "projectId" => "project-1",
                "environmentId" => "environment-1",
                "directoryId" => "directory-1",
                "principalId" => "principal-1",
                "memberships" => [["organisationId" => "org-1", "organisationSlug" => "acme", "organisationName" => "Acme", "role" => "member"]],
            ]],
        ], $calls);
        $target = new ApplicationPrincipalTarget("project-1", "environment-1", "directory-1", "subject-1");
        $projects = $client->adminAuthProjects();

        $profile = $projects->getPrincipalProfile($target, new RequestOptions(owningUserUuid: self::OWNING_USER));
        $projects->setPrincipalProfile(
            $target,
            new ProfileValuesRequest([new ApplicationProfileValue("display_name", "Ada")]),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-profile"),
        );
        $memberships = $projects->listPrincipalMemberships($target);

        self::assertInstanceOf(ApplicationPrincipalProfile::class, $profile);
        self::assertInstanceOf(ApplicationMembershipContext::class, $memberships);
        self::assertSame([
            self::BASE . "/directories/directory-1/principals/subject-1/profile",
            self::BASE . "/directories/directory-1/principals/subject-1/profile",
            self::BASE . "/directories/directory-1/principals/subject-1/memberships",
        ], array_column($calls, "url"));
        self::assertFalse($profile->fields[0]->editable);
        self::assertSame(["display_name"], $profile->missingRequired);
        self::assertSame("member", $memberships->memberships[0]->role);
    }

    public function testDeletesProjectAndEnvironment(): void
    {
        $calls = [];
        $client = $this->clientWithQueue([
            ["body" => [
                "projectId" => "project-1",
                "slug" => "hosting-eu",
                "name" => "Hosting EU",
                "released" => ["environments" => 2, "directories" => 2, "organisations" => 2, "memberships" => 1, "invitations" => 3, "audienceBindings" => 1, "operations" => 4],
            ]],
            ["body" => [
                "projectId" => "project-1",
                "projectSlug" => "hosting-eu",
                "environmentId" => "environment-1",
                "slug" => "staging",
                "name" => "Staging",
                "released" => ["directories" => 1, "organisations" => 1, "memberships" => 0, "invitations" => 1, "audienceBindings" => 1, "operations" => 2, "profileValues" => 3],
            ]],
        ], $calls);
        $projects = $client->adminAuthProjects();

        $deletion = $projects->deleteProject("project-1", new ProjectDeletionRequest("hosting-eu"));
        $environment = $projects->deleteEnvironment("project-1", "environment-1", new EnvironmentDeletionRequest("staging"));

        self::assertInstanceOf(ProjectDeletion::class, $deletion);
        self::assertInstanceOf(EnvironmentDeletion::class, $environment);
        self::assertSame(
            ["http://localhost:8080/api/v1/admin/auth-projects/project-1/delete", self::BASE . "/delete"],
            array_column($calls, "url"),
        );
        self::assertSame(["confirmSlug" => "hosting-eu"], $calls[0]["body"]);
        self::assertSame(2, $deletion->released->environments);
        self::assertSame(3, $environment->released->profileValues);
    }

    public function testOffboardsEnvironmentRetainingData(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "projectId" => "project-1",
            "projectSlug" => "hosting-eu",
            "environmentId" => "environment-1",
            "slug" => "staging",
            "name" => "Staging",
            "authorityWithdrawn" => true,
            "loginPaused" => true,
            "revision" => 8,
            "clientCleanup" => ["status" => "complete", "clientsRemoved" => 2, "errorCategory" => ""],
            "retained" => [
                "directories" => 1,
                "organisations" => 1,
                "memberships" => 3,
                "invitations" => 4,
                "profileValues" => 5,
                "reservedSlots" => 1,
            ],
        ], $calls);
        $projects = $client->adminAuthProjects();

        $offboarding = $projects->offboardEnvironment(
            "project-1",
            "environment-1",
            new EnvironmentOffboardRequest("staging"),
            new RequestOptions(owningUserUuid: self::OWNING_USER),
        );

        self::assertInstanceOf(EnvironmentOffboarding::class, $offboarding);
        self::assertSame(["POST"], array_column($calls, "method"));
        self::assertSame([self::BASE . "/offboard"], array_column($calls, "url"));
        self::assertSame(["confirmSlug" => "staging"], $calls[0]["body"]);
        self::assertSame(self::OWNING_USER, $calls[0]["headers"][self::OWNING_USER_HEADER]);
        self::assertArrayNotHasKey("Idempotency-Key", $calls[0]["headers"]);
        self::assertTrue($offboarding->authorityWithdrawn);
        self::assertTrue($offboarding->loginPaused);
        self::assertSame(8, $offboarding->revision);
        self::assertSame("complete", $offboarding->clientCleanup->status);
        self::assertSame(2, $offboarding->clientCleanup->clientsRemoved);
        self::assertSame(1, $offboarding->retained->reservedSlots);
        self::assertSame(5, $offboarding->retained->profileValues);
        self::assertSame(3, $offboarding->retained->memberships);
    }


    public function testProvisionRealmEnforcesServerRevisionSequence(): void
    {
        $calls = [];
        $client = $this->realmWireClient($calls);

        $receipt = $client->adminAuthProjects()->provisionRealm(
            "project-1",
            "environment-1",
            new RealmProvisionRequest(new DesiredStateRequest(DesiredState::fromPayload((object) $this->desiredState()), 0), "pool-1"),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "realm-provision-1"),
        );

        self::assertCount(4, $calls);
        self::assertSame(
            [
                self::BASE . "/apply",
                self::BASE . "/directories/enable",
                self::BASE . "/clients/reconcile",
                self::BASE . "/status",
            ],
            array_column($calls, "url"),
        );
        self::assertSame("realm-provision-1:apply", $calls[0]["headers"]["Idempotency-Key"]);
        self::assertSame("realm-provision-1:directory-enable", $calls[1]["headers"]["Idempotency-Key"]);
        self::assertSame("realm-provision-1:client-reconcile", $calls[2]["headers"]["Idempotency-Key"]);
        self::assertArrayNotHasKey("Idempotency-Key", $calls[3]["headers"]);
        self::assertSame(1, $calls[1]["body"]["expectedRevision"]);
        self::assertSame(2, $calls[2]["body"]["expectedRevision"]);
        self::assertNull($receipt->failedStep);
        self::assertSame(1, $receipt->apply?->revision);
        self::assertSame(2, $receipt->directory?->revision);
        self::assertSame(2, $receipt->reconcile?->revision);
        self::assertTrue($receipt->status?->reconciled);
    }

    public function testProvisionRealmResumesWithSameBaseKeyAfterLateFailure(): void
    {
        $calls = [];
        $client = $this->realmWireClient($calls, statusFailures: 1);
        $options = new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "realm-provision-2");
        $request = new RealmProvisionRequest(
            new DesiredStateRequest(DesiredState::fromPayload((object) $this->desiredState()), 0),
            "pool-1",
        );

        try {
            $client->adminAuthProjects()->provisionRealm("project-1", "environment-1", $request, $options);
            self::fail("provisionRealm did not throw on a failing status step");
        } catch (RealmProvisionException $error) {
            self::assertSame(RealmProvisionStep::Status, $error->failedStep);
            self::assertSame(2, $error->receipt->directory?->revision);
        }

        $receipt = $client->adminAuthProjects()->provisionRealm("project-1", "environment-1", $request, $options);

        self::assertNull($receipt->failedStep);
        self::assertTrue($receipt->status?->reconciled);
        self::assertCount(8, $calls);
    }

    public function testProvisionRealmReportsFailedDirectoryStep(): void
    {
        $calls = [];
        $client = $this->realmWireClient($calls, directoryFailures: 1);

        try {
            $client->adminAuthProjects()->provisionRealm(
                "project-1",
                "environment-1",
                new RealmProvisionRequest(
                    new DesiredStateRequest(DesiredState::fromPayload((object) $this->desiredState()), 0),
                    "pool-1",
                ),
                new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "realm-provision-3"),
            );
            self::fail("provisionRealm did not throw on a refused directory step");
        } catch (RealmProvisionException $error) {
            self::assertSame(RealmProvisionStep::DirectoryEnable, $error->failedStep);
            self::assertSame(1, $error->receipt->apply?->revision);
            self::assertNull($error->receipt->directory);
            self::assertCount(2, $calls);
        }
    }

    public function testProvisionRealmRejectsOutOfBoundsBaseKey(): void
    {
        $bases = ["missing" => "", "too short" => str_repeat("k", 7), "too long" => str_repeat("k", 112)];

        foreach ($bases as $label => $base) {
            $calls = [];
            $client = $this->realmWireClient($calls);

            try {
                $client->adminAuthProjects()->provisionRealm(
                    "project-1",
                    "environment-1",
                    new RealmProvisionRequest(
                        new DesiredStateRequest(DesiredState::fromPayload((object) $this->desiredState()), 0),
                        "pool-1",
                    ),
                    new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: $base),
                );
                self::fail("provisionRealm accepted an out-of-bounds base key ({$label})");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls, "a request was sent for an out-of-bounds base key ({$label})");
            }
        }
    }

    /**
     * realmWireClient is a stateful stand-in for the admin API's project-auth
     * revision rules, so the provision tests exercise the real ordering contract:
     * an apply at expected revision 0 moves the environment to revision 1, a
     * directory enable or client reconcile must name the current revision, and
     * status is reconciled only when the recorded observation describes it. A
     * repeated Idempotency-Key returns the recorded response instead of writing.
     *
     * @param  list<array<string, mixed>>  $calls
     */
    private function realmWireClient(
        array &$calls,
        int $statusFailures = 0,
        int $directoryFailures = 0,
    ): CustdClient {
        $revision = 0;
        $observedAt = 0;
        /** @var array<string, array<string, mixed>> $operations */
        $operations = [];

        return new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (
                string $method,
                string $url,
                ?array $body,
                string $token,
                array $headers = [],
            ) use (&$calls, &$revision, &$observedAt, &$operations, &$statusFailures, &$directoryFailures): array {
                $calls[] = compact("method", "url", "body", "token", "headers");
                $key = $headers["Idempotency-Key"] ?? "";
                if ($key !== "" && (strlen($key) < 8 || strlen($key) > 128)) {
                    return ["status" => 400, "body" => "{\"title\":\"invalid_idempotency_key\"}"];
                }
                if (array_key_exists($key, $operations)) {
                    return ["status" => 200, "body" => json_encode($operations[$key], flags: JSON_THROW_ON_ERROR)];
                }
                $expected = is_array($body) ? (int) ($body["expectedRevision"] ?? -1) : -1;

                if (str_ends_with($url, "/apply")) {
                    if (!(($revision === 0 && $expected === 0) || ($revision !== 0 && $expected === $revision))) {
                        return ["status" => 409, "body" => "{\"title\":\"revision_conflict\"}"];
                    }
                    $revision = $revision === 0 ? 1 : $revision + 1;
                    $operation = $this->realmOperation($revision, "project_auth_config_update", $key);
                    $operations[$key] = $operation;

                    return ["status" => 200, "body" => json_encode($operation, flags: JSON_THROW_ON_ERROR)];
                }
                if (str_ends_with($url, "/directories/enable")) {
                    if ($directoryFailures > 0) {
                        $directoryFailures--;

                        return ["status" => 409, "body" => "{\"title\":\"revision_conflict\"}"];
                    }
                    if ($expected !== $revision) {
                        return ["status" => 409, "body" => "{\"title\":\"revision_conflict\"}"];
                    }
                    $revision++;
                    $operation = $this->realmOperation($revision, "directory_enable", $key);
                    $operations[$key] = $operation;

                    return ["status" => 200, "body" => json_encode($operation, flags: JSON_THROW_ON_ERROR)];
                }
                if (str_ends_with($url, "/clients/reconcile")) {
                    if ($expected !== $revision) {
                        return ["status" => 409, "body" => "{\"title\":\"client_sync_stale\"}"];
                    }
                    $observedAt = $revision;
                    $report = [
                        "environmentId" => "environment-1",
                        "revision" => $revision,
                        "checkedAt" => "2026-10-16T00:00:00Z",
                        "superseded" => false,
                        "clients" => [],
                    ];
                    $operations[$key] = $report;

                    return ["status" => 200, "body" => json_encode($report, flags: JSON_THROW_ON_ERROR)];
                }
                if (str_ends_with($url, "/status")) {
                    if ($statusFailures > 0) {
                        $statusFailures--;

                        return ["status" => 500, "body" => "{\"title\":\"status_unavailable\"}"];
                    }

                    return ["status" => 200, "body" => json_encode([
                        "projectId" => "project-1",
                        "environmentId" => "environment-1",
                        "revision" => $revision,
                        "desired" => $this->desiredState(),
                        "reconciled" => $observedAt !== 0 && $observedAt === $revision,
                        "reconcileNote" => "",
                        "loginReady" => false,
                        "loginNote" => "",
                        "clientSync" => null,
                    ], flags: JSON_THROW_ON_ERROR)];
                }

                return ["status" => 404, "body" => "{\"title\":\"not_found\"}"];
            },
        ]);
    }

    /** @return array<string, mixed> */
    private function realmOperation(int $revision, string $kind, string $key): array
    {
        return [
            "id" => "op-{$revision}",
            "kind" => $kind,
            "status" => "applied",
            "revision" => $revision,
            "idempotencyKey" => $key,
            "appliedAt" => "2026-10-16T00:00:00Z",
            "replayed" => false,
        ];
    }
}
