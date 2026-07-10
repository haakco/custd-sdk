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

    public function testAdminMeasurementProjectsCreateUsesAdminApi(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 201,
                    "body" => '{"projectUuid":"project-123","projectCode":"checkout-runway","name":"Checkout Runway","kind":"deadline_forecast","status":"active"}',
                ];
            },
        ]);

        $project = $client->adminMeasurementProjects()->create([
            "projectCode" => "checkout-runway",
            "name" => "Checkout Runway",
            "kind" => "deadline_forecast",
            "series" => [[
                "seriesCode" => "checkout-completions",
                "name" => "Checkout completions",
                "unitSlug" => "count",
                "completionDirection" => "increase",
                "source" => "manual",
            ]],
            "target" => [
                "targetCode" => "release",
                "name" => "Release",
                "targetValue" => 100,
                "targetDate" => "2026-08-31T00:00:00Z",
                "state" => "active",
            ],
        ]);

        $this->assertSame("project-123", $project["projectUuid"]);
        $this->assertSame("POST", $calls[0]["method"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/measurement/projects", $calls[0]["url"]);
    }

    public function testAdminMeasurementObservationBulkValidatesRowResults(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 202,
                    "body" => '{"importId":"import-123","accepted":1,"rejected":1,"results":[{"rowIndex":1,"success":true,"status":202,"observationUuid":"observation-123"},{"rowIndex":2,"success":false,"status":422,"type":"https://custd.dev/problems/measurement-invalid-observation","title":"Invalid measurement observation","detail":"observedAt must be an RFC3339 timestamp"}]}',
                ];
            },
        ]);

        $response = $client->adminMeasurementProjects()->submitObservations("checkout-runway", [
            "rows" => [
                $this->measurementObservation("2026-07-01T00:00:00Z"),
                $this->measurementObservation("not-a-timestamp"),
            ],
        ]);

        $this->assertSame(1, $response["accepted"]);
        $this->assertFalse($response["results"][1]["success"]);
        $this->assertSame(
            "http://localhost:8080/api/v1/admin/measurement/projects/checkout-runway/observations:bulk",
            $calls[0]["url"],
        );
    }

    public function testAdminMeasurementCSVImportValidatesRowResults(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 202,
                    "body" => '{"importId":"import-456","accepted":1,"rejected":1,"results":[{"rowIndex":1,"success":true,"status":202,"observationUuid":"observation-456"},{"rowIndex":2,"success":false,"status":422,"type":"https://custd.dev/problems/measurement-invalid-observation","title":"Invalid measurement observation","detail":"value must be finite"}]}',
                ];
            },
        ]);

        $response = $client->adminMeasurementProjects()->importCSVString(
            "checkout-runway",
            "seriesUuid,observedAt,value\ncheckout-completions,2026-07-01T00:00:00Z,42.5\n",
            2,
        );

        $this->assertSame(1, $response["rejected"]);
        $this->assertSame(["csv" => "seriesUuid,observedAt,value\ncheckout-completions,2026-07-01T00:00:00Z,42.5\n"], $calls[0]["body"]);
        $this->assertSame(
            "http://localhost:8080/api/v1/admin/measurement/projects/checkout-runway/observations:csv",
            $calls[0]["url"],
        );
    }

    public function testAdminMeasurementRejectsMismatchedResultCount(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => fn (): array => ["status" => 202, "body" => '{"results":[]}'],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("measurement result count 0 does not match submitted row count 1");

        $client->adminMeasurementProjects()->submitObservation(
            "checkout-runway",
            $this->measurementObservation("2026-07-01T00:00:00Z"),
        );
    }

    public function testAdminMeasurementRejectsSuccessfulRowWithoutObservationUuid(): void
    {
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => fn (): array => [
                "status" => 202,
                "body" => '{"results":[{"rowIndex":1,"success":true,"status":202}]}',
            ],
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("measurement result 0 missing observationUuid");

        $client->adminMeasurementProjects()->submitObservation(
            "checkout-runway",
            $this->measurementObservation("2026-07-01T00:00:00Z"),
        );
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

    /**
     * @return array<string, mixed>
     */
    private function measurementObservation(string $observedAt): array
    {
        return [
            "seriesUuid" => "checkout-completions",
            "observedAt" => $observedAt,
            "value" => 42,
        ];
    }
}
