<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AuditClientTest extends TestCase
{
    public function testAuditReaderCarriesScopeFiltersAndSafeExport(): void
    {
        $calls = [];
        $responses = [
            ["status" => 200, "body" => json_encode([
                "events" => [[
                    "eventId" => "01957abc-0000-7000-8000-000000000001", "tenantSlug" => "acme", "actorKind" => "user", "actorId" => "private-user-id", "actorReference" => "actor-0123456789ab",
                    "actorDisplayName" => "Admin User", "actorRoles" => ["tenant-admin"],
                    "action" => "tenant.create", "resourceType" => "tenant", "resourceId" => "acme",
                    "outcome" => "success", "correlationId" => "req-1", "operationId" => "op-1",
                    "changes" => [["field" => "enabled", "before" => false, "after" => true]],
                    "details" => ["safe" => "value"],
                    "network" => ["ipAddress" => "10.0.0.1", "ipAddressState" => "available", "userAgentState" => "redacted"],
                    "ipAddress" => "legacy-sensitive", "metadata" => "sensitive", "createdAt" => "2026-07-23T12:00:00Z",
                ]],
                "nextCursor" => ["cursor" => "next"],
                "coverageBeginsAt" => "2026-07-01T00:00:00Z",
                "retention" => ["eventMaxAgeSeconds" => 31536000, "ipAddressMaxAgeSeconds" => 15552000, "userAgentMaxAgeSeconds" => 7776000],
                "debug" => "sensitive",
            ], JSON_THROW_ON_ERROR)],
            ["status" => 200, "body" => json_encode([
                "eventId" => "01957abc-0000-7000-8000-000000000001", "tenantSlug" => "acme", "actorKind" => "user", "actorReference" => "actor-0123456789ab",
                "actorDisplayName" => "Admin User", "actorRoles" => ["tenant-admin"],
                "action" => "tenant.create", "resourceType" => "tenant", "resourceId" => "acme",
                "outcome" => "success", "correlationId" => "req-1", "operationId" => "op-1",
                "changes" => [["field" => "enabled", "before" => false, "after" => true]],
                "details" => ["safe" => "value"],
                "network" => ["ipAddressState" => "redacted", "userAgent" => "Mozilla/5.0", "userAgentState" => "available"],
                "ipAddress" => "legacy-sensitive", "metadata" => "sensitive",
                "createdAt" => "2026-07-23T12:00:00Z",
            ], JSON_THROW_ON_ERROR)],
            ["status" => 200, "body" => "eventId,tenantSlug\n01957abc-0000-7000-8000-000000000001,acme\n", "headers" => ["Content-Type" => "text/csv; charset=utf-8"]],
        ];
        $transport = function (string $method, string $url, ?array $body = null, string $token = "", array $headers = []) use (&$calls, &$responses): array {
            $calls[] = [$method, $url, $body, $token, $headers];
            return array_shift($responses);
        };
        $client = new CustdClient("http://localhost:8080", "admin-token", ["admin_http_client" => $transport]);
        $options = [
            "scope" => "global", "affectedTenantSlug" => "acme", "since" => "2026-07-01T00:00:00Z",
            "until" => "2026-08-01T00:00:00Z", "actorKind" => "user", "actorReference" => "actor-0123456789ab",
            "action" => "tenant.create", "resourceType" => "tenant", "resourceId" => "acme",
            "outcome" => "success", "correlationId" => "req-1", "limit" => 50, "cursor" => "next",
        ];

        $listed = $client->adminAudit()->listEvents($options);
        $event = $client->adminAudit()->getEvent("01957abc-0000-7000-8000-000000000001", ["scope" => "tenant", "companySlug" => "acme"]);
        $exported = $client->adminAudit()->exportEvents($options, "csv");

        $this->assertSame("next", $listed["nextCursor"]["cursor"]);
        $this->assertSame("2026-07-01T00:00:00Z", $listed["coverageBeginsAt"]);
        $this->assertSame(31536000, $listed["retention"]["eventMaxAgeSeconds"]);
        $this->assertSame("Admin User", $listed["events"][0]["actorDisplayName"]);
        $this->assertArrayNotHasKey("actorId", $listed["events"][0]);
        $this->assertSame(["tenant-admin"], $listed["events"][0]["actorRoles"]);
        $this->assertSame("success", $listed["events"][0]["outcome"]);
        $this->assertSame("req-1", $listed["events"][0]["correlationId"]);
        $this->assertSame("op-1", $listed["events"][0]["operationId"]);
        $this->assertTrue($listed["events"][0]["changes"][0]["after"]);
        $this->assertSame("available", $listed["events"][0]["network"]["ipAddressState"]);
        $this->assertSame("value", $listed["events"][0]["details"]["safe"]);
        $this->assertArrayNotHasKey("ipAddress", $listed["events"][0]);
        $this->assertArrayNotHasKey("debug", $listed);
        $this->assertArrayNotHasKey("metadata", $event);
        $this->assertSame("eventId,tenantSlug\n01957abc-0000-7000-8000-000000000001,acme\n", $exported["body"]);
        $this->assertSame("text/csv; charset=utf-8", $exported["headers"]["content-type"]);
        $this->assertStringNotContainsString("limit=50", $calls[2][1]);
        $this->assertStringNotContainsString("cursor=next", $calls[2][1]);
        $this->assertStringContainsString(
            "/api/v1/admin/audit/events/export?scope=global&affectedTenantSlug=acme&since=2026-07-01T00%3A00%3A00Z&until=2026-08-01T00%3A00%3A00Z&actorKind=user&actorReference=actor-0123456789ab&action=tenant.create&resourceType=tenant&resourceId=acme&outcome=success&correlationId=req-1&format=csv",
            $calls[2][1],
        );
    }

    public function testAuditReaderRejectsNonUuidEventId(): void
    {
        $transport = static fn (string $method, string $url, ?array $body = null, string $token = "", array $headers = []): array => [
            "status" => 200,
            "body" => json_encode(["events" => [["eventId" => "ev-1"]], "nextCursor" => ["cursor" => ""]], JSON_THROW_ON_ERROR),
        ];
        $client = new CustdClient("http://localhost:8080", "admin-token", ["admin_http_client" => $transport]);

        $this->expectExceptionMessage("eventId must be a UUID");
        $client->adminAudit()->listEvents();
    }

    public function testReportingPackAuditReaderUsesPackKeyAndSafeActorFields(): void
    {
        $transport = static fn (string $method, string $url, ?array $body = null, string $token = "", array $headers = []): array => [
            "status" => 200,
            "body" => json_encode(["events" => [[
                "action" => "draft_created", "actorId" => "private-user-id", "actorReference" => "actor-0123456789ab",
                "actorDisplayName" => "Admin User", "resourceType" => "reporting_pack", "resourceId" => "42",
                "packKey" => "security", "createdAt" => "2026-07-23T12:00:00Z", "metadata" => "sensitive",
            ]]], JSON_THROW_ON_ERROR),
        ];
        $client = new CustdClient("http://localhost:8080", "admin-token", ["admin_http_client" => $transport]);

        $result = $client->adminAudit()->listReportingPackEvents("security");

        $this->assertSame("actor-0123456789ab", $result["events"][0]["actorReference"]);
        $this->assertArrayNotHasKey("actorId", $result["events"][0]);
        $this->assertArrayNotHasKey("metadata", $result["events"][0]);
    }
}
