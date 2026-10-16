<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\DataScope\CreateResourceRequest;
use HaakCo\Custd\Admin\DataScope\CreateScopeRequest;
use HaakCo\Custd\Admin\DataScope\Grant;
use HaakCo\Custd\Admin\DataScope\GrantTarget;
use HaakCo\Custd\Admin\DataScope\PrincipalRef;
use HaakCo\Custd\Admin\DataScope\UpdateResourceRequest;
use HaakCo\Custd\Admin\DataScope\UpdateScopeRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class DataScopeClientTest extends TestCase
{
    private const SCOPE_UUID = "11111111-1111-1111-1111-111111111111";
    private const RESOURCE_UUID = "33333333-3333-3333-3333-333333333333";
    private const USER_UUID = "22222222-2222-2222-2222-222222222222";

    public function testScopeCrudUsesAdminRoutes(): void
    {
        $calls = [];
        $scopes = $this->client($calls)->adminDataScopes();

        $scope = $scopes->createScope(new CreateScopeRequest("acme-store", "Acme Store"));
        self::assertSame("http://localhost:8080/api/v1/admin/data-scopes", $calls[0]["url"]);
        self::assertSame("POST", $calls[0]["method"]);
        self::assertSame(["code" => "acme-store", "name" => "Acme Store"], $calls[0]["body"]);
        self::assertSame(self::SCOPE_UUID, $scope->uuid);

        $scopes->listScopes(true);
        self::assertSame("http://localhost:8080/api/v1/admin/data-scopes?includeDisabled=true", $calls[1]["url"]);

        $scopes->getScope(self::SCOPE_UUID);
        self::assertSame("http://localhost:8080/api/v1/admin/data-scopes/" . self::SCOPE_UUID, $calls[2]["url"]);

        $scopes->updateScope(self::SCOPE_UUID, new UpdateScopeRequest(status: "disabled"));
        self::assertSame("PATCH", $calls[3]["method"]);
        self::assertSame(["status" => "disabled"], $calls[3]["body"]);

        $scopes->disableScope(self::SCOPE_UUID);
        self::assertSame("http://localhost:8080/api/v1/admin/data-scopes/" . self::SCOPE_UUID . "/disable", $calls[4]["url"]);
    }

    public function testResourceCrudUsesScopeScopedRoutes(): void
    {
        $calls = [];
        $scopes = $this->client($calls)->adminDataScopes();
        $base = "http://localhost:8080/api/v1/admin/data-scopes/" . self::SCOPE_UUID . "/resources";

        $scopes->createResource(self::SCOPE_UUID, new CreateResourceRequest("srv-01", "Server 1"));
        self::assertSame($base, $calls[0]["url"]);

        $scopes->listResources(self::SCOPE_UUID, true);
        self::assertSame($base . "?includeDisabled=true", $calls[1]["url"]);

        $scopes->getResource(self::SCOPE_UUID, self::RESOURCE_UUID);
        self::assertSame($base . "/" . self::RESOURCE_UUID, $calls[2]["url"]);

        $scopes->updateResource(self::SCOPE_UUID, self::RESOURCE_UUID, new UpdateResourceRequest(name: "Server One"));
        self::assertSame("PATCH", $calls[3]["method"]);

        $scopes->disableResource(self::SCOPE_UUID, self::RESOURCE_UUID);
        self::assertSame($base . "/" . self::RESOURCE_UUID . "/disable", $calls[4]["url"]);
    }

    public function testGrantRoutesAndPrincipalQuery(): void
    {
        $calls = [];
        $scopes = $this->client($calls)->adminDataScopes();

        $scopes->listGrants(new PrincipalRef("human", userUuid: self::USER_UUID));
        self::assertStringContainsString("/api/v1/admin/data-scope-grants?", $calls[0]["url"]);
        self::assertStringContainsString("kind=human", $calls[0]["url"]);
        self::assertStringContainsString("userUuid=" . self::USER_UUID, $calls[0]["url"]);

        $grant = new Grant(
            new PrincipalRef("machine", clientId: "custd-producer"),
            new GrantTarget("sub_client", scopeUuid: self::SCOPE_UUID),
            "read",
        );
        $scopes->createGrant($grant);
        self::assertSame("http://localhost:8080/api/v1/admin/data-scope-grants", $calls[1]["url"]);
        self::assertSame(
            [
                "principal" => ["kind" => "machine", "clientId" => "custd-producer"],
                "target" => ["kind" => "sub_client", "scopeUuid" => self::SCOPE_UUID],
                "action" => "read",
            ],
            $calls[1]["body"],
        );

        $scopes->revokeGrant($grant);
        self::assertSame("http://localhost:8080/api/v1/admin/data-scope-grants/revoke", $calls[2]["url"]);
    }

    public function testRejectsInvalidShapesBeforeSending(): void
    {
        $cases = [
            "bad code" => fn () => new CreateScopeRequest("bad code", "x"),
            "empty name" => fn () => new CreateScopeRequest("ok", "  "),
            "empty update" => fn () => new UpdateScopeRequest(),
            "bad status" => fn () => new UpdateScopeRequest(status: "paused"),
            "human with client" => fn () => new PrincipalRef("human", userUuid: self::USER_UUID, clientId: "x"),
            "machine without client" => fn () => new PrincipalRef("machine"),
            "unknown kind" => fn () => new PrincipalRef("robot", clientId: "x"),
            "parent with scope" => fn () => new GrantTarget("parent", scopeUuid: self::SCOPE_UUID),
            "unknown action" => fn () => new Grant(
                new PrincipalRef("machine", clientId: "custd-producer"),
                new GrantTarget("parent"),
                "admin",
            ),
        ];
        foreach ($cases as $name => $case) {
            try {
                $case();
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function scope(): array
    {
        return [
            "uuid" => self::SCOPE_UUID,
            "code" => "acme-store",
            "name" => "Acme Store",
            "status" => "active",
            "createdAt" => "2026-10-15T00:00:00Z",
            "updatedAt" => "2026-10-15T00:00:00Z",
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resource(): array
    {
        return array_merge($this->scope(), [
            "uuid" => self::RESOURCE_UUID,
            "scopeUuid" => self::SCOPE_UUID,
            "code" => "srv-01",
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function grantPayload(): array
    {
        return [
            "principal" => ["kind" => "machine", "clientId" => "custd-producer"],
            "target" => ["kind" => "sub_client", "scopeUuid" => self::SCOPE_UUID],
            "action" => "read",
        ];
    }

    /**
     * client builds a client whose transport answers each route with the shape
     * that route returns, so a list call is not satisfied by a detail body.
     *
     * @param array<int, array<string, mixed>> $calls
     */
    private function client(array &$calls): CustdClient
    {
        $scope = $this->scope();
        $resource = $this->resource();
        $grant = $this->grantPayload();
        $transport = function (string $method, string $url, ?array $body, string $token) use (&$calls, $scope, $resource, $grant): array {
            $calls[] = compact("method", "url", "body", "token");
            $path = (string) parse_url($url, PHP_URL_PATH);
            if (str_ends_with($path, "/disable") || str_ends_with($path, "/revoke")) {
                return ["status" => 204, "body" => ""];
            }
            if (str_contains($path, "/resources")) {
                $payload = $method === "GET" && !preg_match('#/resources/[^/]+$#', $path)
                    ? ["resources" => [$resource]]
                    : $resource;

                return ["status" => 200, "body" => json_encode($payload, JSON_THROW_ON_ERROR)];
            }
            if (str_ends_with($path, "/data-scope-grants")) {
                $payload = $method === "GET" ? ["grants" => []] : $grant;

                return ["status" => 200, "body" => json_encode($payload, JSON_THROW_ON_ERROR)];
            }
            $payload = $method === "GET" && !preg_match('#/data-scopes/[^/]+$#', $path)
                ? ["scopes" => [$scope]]
                : $scope;

            return ["status" => 200, "body" => json_encode($payload, JSON_THROW_ON_ERROR)];
        };

        return new CustdClient("http://localhost:8080", "token", ["admin_http_client" => $transport]);
    }
}
