<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AdminClientTest extends TestCase
{
    public function testAdminTenantsCreateUsesAdminApi(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080/", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 201,
                    "body" => '{"slug":"acme","companyName":"Acme Inc","enabled":true}',
                ];
            },
        ]);

        $tenant = $client->adminTenants()->create(["slug" => "acme", "companyName" => "Acme Inc"]);

        $this->assertSame("acme", $tenant["slug"]);
        $this->assertSame("POST", $calls[0]["method"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/tenants", $calls[0]["url"]);
        $this->assertSame("admin-token", $calls[0]["token"]);
        $this->assertSame(["slug" => "acme", "companyName" => "Acme Inc"], $calls[0]["body"]);
    }

    public function testOAuthClientListDoesNotExposeClientSecret(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"clientId":"custd-acme","companySlug":"acme","scopes":["events.write"],"clientSecret":"secret"}',
            ],
            [
                "status" => 200,
                "body" => '{"clients":[{"clientId":"custd-acme","companySlug":"acme","scopes":["events.write"]}]}',
            ],
        ];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function () use (&$responses): array {
                return array_shift($responses);
            },
        ]);

        $created = $client->adminOAuthClients()->create([
            "clientId" => "custd-acme",
            "companySlug" => "acme",
            "scopes" => ["events.write"],
        ]);
        $list = $client->adminOAuthClients()->list();

        $this->assertSame("secret", $created["clientSecret"]);
        $this->assertArrayNotHasKey("clientSecret", $list["clients"][0]);
    }

    public function testAdminSitesManageBrowserSites(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"siteUuid":"site-123","companySlug":"acme","name":"Docs","identityMode":"cookieless","allowedOrigins":["https://example.com"],"rateLimitPerMinute":600,"retentionDays":365,"writeKey":"site_pk_test"}',
            ],
            ["status" => 200, "body" => '{"writeKey":"site_pk_next"}'],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $created = $client->adminSites()->create([
            "companySlug" => "acme",
            "name" => "Docs",
            "identityMode" => "cookieless",
            "allowedOrigins" => ["https://example.com"],
        ]);
        $rotated = $client->adminSites()->rotateWriteKey("site-123");

        $this->assertSame("site_pk_test", $created["writeKey"]);
        $this->assertSame("site_pk_next", $rotated["writeKey"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/sites", $calls[0]["url"]);
    }

    public function testAdminSitesListGetDeleteDoNotExposeWriteKeys(): void
    {
        $site = [
            "siteUuid" => "site-123",
            "companySlug" => "acme",
            "name" => "Docs",
            "identityMode" => "cookieless",
            "allowedOrigins" => ["https://example.com"],
            "rateLimitPerMinute" => 600,
            "retentionDays" => 365,
            "enabled" => true,
            "writeKey" => "site_pk_should_not_leak",
        ];
        $responses = [
            ["status" => 200, "body" => json_encode(["sites" => [$site]], JSON_THROW_ON_ERROR)],
            ["status" => 200, "body" => json_encode($site, JSON_THROW_ON_ERROR)],
            ["status" => 204, "body" => ""],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $listed = $client->adminSites()->list();
        $got = $client->adminSites()->get("site-123");
        $client->adminSites()->delete("site-123");

        $this->assertArrayNotHasKey("writeKey", $listed["sites"][0]);
        $this->assertArrayNotHasKey("writeKey", $got);
        $this->assertSame([
            ["GET", "http://localhost:8080/api/v1/admin/sites"],
            ["GET", "http://localhost:8080/api/v1/admin/sites/site-123"],
            ["DELETE", "http://localhost:8080/api/v1/admin/sites/site-123"],
        ], array_map(
            static fn (array $call): array => [$call["method"], $call["url"]],
            $calls,
        ));
    }

    public function testAdminSchemasRegisterAndVersionSchemas(): void
    {
        $responses = [
            [
                "status" => 200,
                "body" => '{"schemas":[{"eventTypeSlug":"courib.delivery.created","version":"1.0.0"}]}',
            ],
            [
                "status" => 201,
                "body" => '{"eventTypeSlug":"courib.delivery.created","version":"1.0.0","jsonSchema":{"type":"object"}}',
            ],
            [
                "status" => 201,
                "body" => '{"eventTypeSlug":"courib.delivery.created","version":"1.1.0","jsonSchema":{"type":"object"}}',
            ],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $list = $client->adminSchemas()->list();
        $registered = $client->adminSchemas()->register([
            "eventTypeSlug" => "courib.delivery.created",
            "version" => "1.0.0",
            "jsonSchema" => ["type" => "object"],
        ]);
        $next = $client->adminSchemas()->createVersion("courib.delivery.created", [
            "version" => "1.1.0",
            "jsonSchema" => ["type" => "object"],
        ]);

        $this->assertSame("courib.delivery.created", $list["schemas"][0]["eventTypeSlug"]);
        $this->assertSame("1.0.0", $registered["version"]);
        $this->assertSame("1.1.0", $next["version"]);
        $this->assertSame([
            ["GET", "http://localhost:8080/api/v1/admin/schemas"],
            ["POST", "http://localhost:8080/api/v1/admin/schemas"],
            ["POST", "http://localhost:8080/api/v1/admin/schemas/courib.delivery.created/versions"],
        ], array_map(
            static fn (array $call): array => [$call["method"], $call["url"]],
            $calls,
        ));
    }

    public function testAdminErrorResponseSurfacesProblemDetail(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (): array {
                return [
                    "status" => 409,
                    "body" => '{"type":"conflict","title":"Conflict","status":409,'
                        . '"detail":"tenant slug already exists","code":"duplicate_slug"}',
                ];
            },
        ]);

        try {
            $client->adminTenants()->create(["slug" => "acme", "companyName" => "Acme Inc"]);
            $this->fail("expected RuntimeException on RFC 9457 admin error");
        } catch (\RuntimeException $err) {
            self::assertStringContainsString("tenant slug already exists", $err->getMessage());
            self::assertStringContainsString("status 409", $err->getMessage());
            self::assertStringContainsString("duplicate_slug", $err->getMessage());
        }
    }
}
