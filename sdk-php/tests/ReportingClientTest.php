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
        self::assertSame("14d", $dashboard["defaultRange"]);
        self::assertSame(300, $dashboard["refreshSeconds"]);
        self::assertSame(["reporting:read"], $dashboard["requiredScopes"]);
        self::assertSame("awthy_secure_checkout_flow", $dashboard["widgets"][0]["template"]);
        self::assertSame(["flow_completion_rate"], $dashboard["widgets"][0]["metrics"]);
        self::assertSame(["flow_step"], $dashboard["widgets"][0]["dimensions"]);
        self::assertSame("GET", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/dashboards/awthy_managed_audit_reporting", $calls[0]["url"]);
    }

    public function testQueryReturnsTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-awthy-trust.json", $calls);

        $request = $this->fixture("reporting-query-max-rows.json");
        $widget = $client->reporting()->query($request);

        self::assertSame(2, $widget["count"]);
        self::assertTrue($widget["complete"]);
        self::assertFalse($widget["truncated"]);
        self::assertSame(42, $widget["queryDurationMs"]);
        self::assertSame(1, $widget["parquetUriCount"]);
        self::assertSame(120000, $widget["snapshotAgeMs"]);
        self::assertSame(8000, $widget["eventLagP95Ms"]);
        self::assertSame(1, $widget["deltaCount"]);
        self::assertSame(100, $widget["deltaPercent"]);
        self::assertSame("vs previous period", $widget["deltaLabel"]);
        self::assertSame("completed checkouts", $widget["secondaryLabel"]);
        self::assertSame("auto", $widget["buckets"][0]["source"]);
        self::assertTrue($widget["buckets"][0]["complete"]);
        self::assertSame(42, $widget["buckets"][0]["queryDurationMs"]);
        self::assertSame(1, $widget["buckets"][0]["parquetUriCount"]);
        self::assertSame("healthy", $widget["trust"]["status"]);
        self::assertSame("healthy", $widget["trust"]["rollupState"]);
        self::assertSame("awthy-audit-event/1.0.0", $widget["trust"]["schemaVersion"]);
        self::assertSame("complete", $widget["trust"]["coverage"]);
        self::assertSame("reporting.read", $widget["trust"]["permissionClass"]);
        self::assertSame([], $widget["trust"]["queryWarnings"]);
        self::assertSame("POST", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/query", $calls[0]["url"]);
        self::assertSame($request, $calls[0]["body"]);
        self::assertSame(50, $calls[0]["body"]["maxRows"]);
        self::assertArrayNotHasKey("rowLimit", $calls[0]["body"]);
    }

    public function testQueryRejectsUnsafeTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-unsafe-trust.json", $calls);

        try {
            $client->reporting()->query([
                "template" => "awthy_secure_checkout_flow",
                "metrics" => ["flow_completion_rate"],
                "rangeDays" => 1,
            ]);
            self::fail("Query returned no error for unsafe trust diagnostics");
        } catch (\RuntimeException $error) {
            $message = $error->getMessage();
            self::assertSame("custd: unsafe reporting trust diagnostics", $message);
            foreach ([
                "customer@example.test",
                "unknown",
                "failed",
                "none",
                "not_enough_data",
                "enabled",
                "present",
            ] as $unsafeValue) {
                self::assertStringNotContainsString($unsafeValue, $message);
            }
        }
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

    /**
     * @return array<string, mixed>
     */
    private function fixture(string $fixture): array
    {
        $contents = (string) file_get_contents(__DIR__ . "/../../contract-fixtures/" . $fixture);

        return json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
    }
}
