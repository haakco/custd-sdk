<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\AuthProject\ApplicationSessionInventory;
use HaakCo\Custd\Admin\AuthProject\Creation;
use HaakCo\Custd\Admin\AuthProject\CreateRequest;
use HaakCo\Custd\Admin\AuthProject\EnvironmentCreateRequest;
use HaakCo\Custd\Admin\AuthProject\ListResponse;
use HaakCo\Custd\Admin\AuthProject\MembershipRevocation;
use HaakCo\Custd\Admin\AuthProject\MembershipRevokeRequest;
use HaakCo\Custd\Admin\AuthProject\RequestOptions;
use HaakCo\Custd\Admin\AuthProject\SessionRevocation;
use HaakCo\Custd\Admin\AuthProject\SessionRevokeRequest;
use HaakCo\Custd\Admin\AuthProject\SessionsRevokeAllRequest;
use HaakCo\Custd\Admin\AuthProject\Summary;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AuthProjectClientTest extends TestCase
{
    private const OWNING_USER = "01957abc-0000-7000-8000-0000000000aa";

    private const OWNING_USER_HEADER = "X-Custd-Owning-User-UUID";

    /** @return array<string, mixed> */
    private function summary(): array
    {
        return [
            "projectId" => "01957abc-0000-7000-8000-000000000001",
            "slug" => "hosting-eu",
            "name" => "Hosting EU",
            "environmentId" => "01957abc-0000-7000-8000-000000000002",
            "environmentSlug" => "production",
            "identityMode" => "isolated",
        ];
    }

    public function testCreatesAProjectWithTheOwningUserHeader(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            ["project" => $this->summary(), "operationId" => "op-1", "replayed" => false, "runtimeReady" => true],
            $calls
        );

        $creation = $client->adminAuthProjects()->createProject(
            new CreateRequest(slug: "hosting-eu", name: "Hosting EU", environmentSlug: "production", identityMode: "isolated"),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-1"),
        );

        self::assertSame(["POST"], array_column($calls, "method"));
        self::assertSame(["http://localhost:8080/api/v1/admin/auth-projects"], array_column($calls, "url"));
        self::assertSame("admin-token", $calls[0]["token"]);
        self::assertSame(self::OWNING_USER, $calls[0]["headers"][self::OWNING_USER_HEADER]);
        self::assertSame("idem-1", $calls[0]["headers"]["Idempotency-Key"]);
        self::assertSame(
            ["slug" => "hosting-eu", "name" => "Hosting EU", "environmentSlug" => "production", "identityMode" => "isolated"],
            $calls[0]["body"]
        );
        self::assertInstanceOf(Creation::class, $creation);
        self::assertSame("op-1", $creation->operationId);
        self::assertFalse($creation->replayed);
        self::assertTrue($creation->runtimeReady);
        self::assertSame("01957abc-0000-7000-8000-000000000002", $creation->project->environmentId);
        self::assertSame("isolated", $creation->project->identityMode);
    }

    public function testListsProjectsWithThePagingCursor(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["projects" => [$this->summary()], "nextAfter" => "cursor-2"], $calls);

        $page = $client->adminAuthProjects()->listProjects(
            "cursor-1",
            new RequestOptions(owningUserUuid: self::OWNING_USER)
        );

        self::assertSame(["GET"], array_column($calls, "method"));
        self::assertSame(["http://localhost:8080/api/v1/admin/auth-projects?after=cursor-1"], array_column($calls, "url"));
        self::assertNull($calls[0]["body"]);
        self::assertSame(self::OWNING_USER, $calls[0]["headers"][self::OWNING_USER_HEADER]);
        self::assertInstanceOf(ListResponse::class, $page);
        self::assertSame("hosting-eu", $page->projects[0]->slug);
        self::assertSame("cursor-2", $page->nextAfter);
    }

    public function testAddsAnEnvironment(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            array_merge($this->summary(), ["environmentId" => "env-2", "environmentSlug" => "staging"]),
            $calls
        );

        $environment = $client->adminAuthProjects()->createEnvironment(
            "project-1",
            new EnvironmentCreateRequest(slug: "staging", name: "Staging", identityMode: "isolated"),
            new RequestOptions(owningUserUuid: self::OWNING_USER),
        );

        self::assertSame(["POST"], array_column($calls, "method"));
        self::assertSame(["http://localhost:8080/api/v1/admin/auth-projects/project-1/environments"], array_column($calls, "url"));
        self::assertSame(
            ["slug" => "staging", "name" => "Staging", "identityMode" => "isolated"],
            $calls[0]["body"]
        );
        self::assertInstanceOf(Summary::class, $environment);
        self::assertSame("staging", $environment->environmentSlug);
    }

    public function testListsAPrincipalsSessions(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "projectId" => "project-1",
            "environmentId" => "environment-1",
            "directoryId" => "directory-1",
            "principalId" => "principal-1",
            "sessions" => [[
                "sessionId" => "session-1",
                "active" => true,
                "authenticatedAt" => "2026-10-01T00:00:00Z",
                "authenticatorAssuranceLevel" => "aal1",
                "expiresAt" => "2026-10-01T00:04:30Z",
                "issuedAt" => "2026-10-01T00:00:00Z",
            ]],
        ], $calls);

        $inventory = $client->adminAuthProjects()->listPrincipalSessions(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            new RequestOptions(owningUserUuid: self::OWNING_USER),
        );

        self::assertSame(["GET"], array_column($calls, "method"));
        self::assertSame(
            ["http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
                . "/directories/directory-1/principals/subject-1/sessions"],
            array_column($calls, "url")
        );
        self::assertInstanceOf(ApplicationSessionInventory::class, $inventory);
        self::assertSame("principal-1", $inventory->principalId);
        self::assertSame("session-1", $inventory->sessions[0]->sessionId);
        self::assertTrue($inventory->sessions[0]->active);
        self::assertSame("aal1", $inventory->sessions[0]->authenticatorAssuranceLevel);
    }

    public function testRevokesOneSession(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            ["projectId" => "project-1", "directoryId" => "directory-1", "principalId" => "principal-1", "revoked" => 1],
            $calls
        );

        $revocation = $client->adminAuthProjects()->revokePrincipalSession(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            new SessionRevokeRequest(sessionId: "session-1"),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-2"),
        );

        self::assertSame(
            ["http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
                . "/directories/directory-1/principals/subject-1/sessions/revoke"],
            array_column($calls, "url")
        );
        self::assertSame(["sessionId" => "session-1"], $calls[0]["body"]);
        self::assertSame("idem-2", $calls[0]["headers"]["Idempotency-Key"]);
        self::assertInstanceOf(SessionRevocation::class, $revocation);
        self::assertSame(1, $revocation->revoked);
    }

    public function testRevokesAllSessionsWithAnExplicitConfirmation(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            ["projectId" => "project-1", "directoryId" => "directory-1", "principalId" => "principal-1", "revoked" => 3],
            $calls
        );

        $revocation = $client->adminAuthProjects()->revokePrincipalSessions(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            new SessionsRevokeAllRequest(confirm: true),
            new RequestOptions(owningUserUuid: self::OWNING_USER, idempotencyKey: "idem-3"),
        );

        self::assertSame(
            ["http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
                . "/directories/directory-1/principals/subject-1/sessions/revoke-all"],
            array_column($calls, "url")
        );
        self::assertSame(["confirm" => true], $calls[0]["body"]);
        self::assertSame(3, $revocation->revoked);
    }

    public function testRevokesAMembership(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([
            "projectId" => "project-1",
            "environmentId" => "environment-1",
            "directoryId" => "directory-1",
            "principalId" => "principal-1",
            "organisationId" => "organisation-1",
            "removedAt" => "2026-10-01T00:00:00Z",
            "removed" => true,
        ], $calls);

        $revocation = $client->adminAuthProjects()->revokePrincipalMembership(
            "project-1",
            "environment-1",
            "directory-1",
            "subject-1",
            new MembershipRevokeRequest(organisationId: "organisation-1", reason: "offboarded"),
            new RequestOptions(owningUserUuid: self::OWNING_USER),
        );

        self::assertSame(
            ["http://localhost:8080/api/v1/admin/auth-projects/project-1/environments/environment-1"
                . "/directories/directory-1/principals/subject-1/memberships/revoke"],
            array_column($calls, "url")
        );
        self::assertSame(["organisationId" => "organisation-1", "reason" => "offboarded"], $calls[0]["body"]);
        self::assertInstanceOf(MembershipRevocation::class, $revocation);
        self::assertTrue($revocation->removed);
        self::assertSame("organisation-1", $revocation->organisationId);
    }

    public function testRejectsAMissingIdempotencyKeyBeforeSending(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([], $calls);

        try {
            $client->adminAuthProjects()->createProject(
                new CreateRequest(slug: "hosting-eu", name: "Hosting EU", environmentSlug: "production", identityMode: "isolated"),
                new RequestOptions(owningUserUuid: self::OWNING_USER),
            );
            self::fail("expected a missing idempotency key to be rejected");
        } catch (\InvalidArgumentException $error) {
            self::assertStringContainsString("idempotency key is required", $error->getMessage());
            self::assertSame([], $calls);
        }
    }

    public function testRejectsAnUnknownIdentityMode(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new CreateRequest(slug: "hosting-eu", name: "Hosting EU", environmentSlug: "production", identityMode: "shared-across");
    }

    public function testOmitsTheOwningUserHeaderForAHumanAdministrator(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["projects" => []], $calls);

        $client->adminAuthProjects()->listProjects();

        self::assertSame(["http://localhost:8080/api/v1/admin/auth-projects"], array_column($calls, "url"));
        self::assertArrayNotHasKey(self::OWNING_USER_HEADER, $calls[0]["headers"]);
    }

    /**
     * @param array<string, mixed> $response
     * @param list<array<string, mixed>> $calls
     */
    private function clientWithResponse(array $response, array &$calls): CustdClient
    {
        return new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (
                string $method,
                string $url,
                ?array $body,
                string $token,
                array $headers = [],
            ) use (&$calls, $response): array {
                $calls[] = compact("method", "url", "body", "token", "headers");

                return ["status" => 200, "body" => json_encode($response, flags: JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
