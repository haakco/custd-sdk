<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class ReportingClientTest extends TestCase
{
    public function testDashboardReadsAwthyDashboard(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-dashboard-awthy.json", $calls);

        $dashboard = $client->reporting()->dashboard("awthy_managed_audit_reporting");

        self::assertSame("awthy_managed_audit_reporting", $dashboard["key"]);
        self::assertSame("GET", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting", $calls[0]["url"]);
    }

    public function testQueryReturnsTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-awthy-trust.json", $calls);

        $widget = $client->reporting()->query([
            "template" => "awthy_secure_checkout_flow",
            "metrics" => ["flow_completion_rate"],
            "from" => "2026-07-06",
            "to" => "2026-07-06",
            "maxRows" => 50,
        ]);

        self::assertSame("healthy", $widget["trust"]["status"]);
        self::assertSame("POST", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/query", $calls[0]["url"]);
    }

    public function testQueryRejectsUnsafeTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-unsafe-trust.json", $calls);

        $this->expectExceptionMessage("unsafe reporting trust diagnostics");

        $client->reporting()->query([
            "template" => "awthy_secure_checkout_flow",
            "metrics" => ["flow_completion_rate"],
            "rangeDays" => 1,
        ]);
    }

    /**
     * @param list<array<string, mixed>> $calls
     */
    private function clientWithFixture(string $fixture, array &$calls): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $fixture): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 200,
                    "body" => (string) file_get_contents(__DIR__ . "/../../contract-fixtures/" . $fixture),
                ];
            },
        ]);
    }
}
