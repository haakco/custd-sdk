<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class ReportingClientTest extends TestCase
{
    public function testSubjectInsightSendsClosedRequestAndReturnsRenderedData(): void
    {
        $calls = [];
        $response = $this->fixture("reporting-subject-insight-response.json");
        foreach (["reporting-subject-insight-request.json", "reporting-subject-insight-date-range-request.json"] as $fixture) {
            $calls = [];
            $client = $this->clientWithFixture("reporting-subject-insight-response.json", $calls);
            $request = $this->fixture($fixture);

            $result = $client->reporting()->subjectInsight($request);

            self::assertSame($response["data"], $result["data"]);
            self::assertSame("POST", $calls[0]["method"]);
            self::assertSame("http://localhost:8080/api/v1/reporting/insights/subject", $calls[0]["url"]);
            self::assertSame($request, $calls[0]["body"]);
        }
    }

    public function testSubjectInsightRejectsMissingSubjectAndUnknownFields(): void
    {
        foreach ([
            $this->fixture("invalid-reporting-subject-insight-missing-subject.json"),
            ["template" => "subject_activity", "subject" => "subject_7f3b", "filters" => []],
            ["template" => "subject_activity", "subject" => "subject_7f3b", "from" => "2026-07-01T00:00:00Z"],
            [
                "template" => "subject_activity",
                "subject" => "subject_7f3b",
                "from" => "2026-07-01T00:00:00Z",
                "to" => "2026-07-18T00:00:00Z",
                "rangeDays" => 18,
            ],
            ["template" => "Invalid", "subject" => "subject_7f3b", "rangeDays" => 7],
            [
                "template" => "subject_activity",
                "subject" => "subject_7f3b",
                "from" => "2026-07-18T00:00:00Z",
                "to" => "2026-07-01T00:00:00Z",
            ],
            ["template" => "subject_activity", "subject" => "subject_7f3b", "rangeDays" => true],
            [
                "template" => "subject_activity",
                "subject" => "subject_7f3b",
                "from" => "2026-02-30T00:00:00Z",
                "to" => "2026-03-01T00:00:00Z",
            ],
            [
                "template" => "subject_activity",
                "subject" => "subject_7f3b",
                "from" => "2026-02-01T00:00Z",
                "to" => "2026-03-01T00:00:00Z",
            ],
        ] as $request) {
            $calls = [];
            $client = $this->clientWithResponse([], $calls);
            try {
                $client->reporting()->subjectInsight($request);
                self::fail("Subject insight accepted an invalid request");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls);
            }
        }
    }

    public function testSubjectInsightRejectsMalformedRenderedWidget(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("invalid-reporting-subject-insight-response.json", $calls);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("rendered widget");
        $client->reporting()->subjectInsight([
            "template" => "subject_activity",
            "subject" => "subject_7f3b",
            "rangeDays" => 7,
        ]);
    }

    public function testSubjectInsightRejectsUnsafeTrustDiagnostics(): void
    {
        $calls = [];
        $response = $this->fixture("reporting-subject-insight-response.json");
        $response["data"]["trust"] = ["token" => "secret"];
        $client = $this->clientWithResponse($response, $calls);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("unsafe reporting trust diagnostics");
        $client->reporting()->subjectInsight($this->fixture("reporting-subject-insight-request.json"));
    }

    public function testSubjectInsightRejectsMalformedOptionalRenderedData(): void
    {
        $calls = [];
        $response = $this->fixture("reporting-subject-insight-response.json");
        $response["data"]["metadata"] = ["resolvedTemplate" => "learning_subject"];
        $client = $this->clientWithResponse($response, $calls);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("malformed rendered widget data");
        $client->reporting()->subjectInsight($this->fixture("reporting-subject-insight-request.json"));
    }

    public function testSubjectInsightPropagatesReportingAuthError(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([], $calls, 403);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("status 403");
        $client->reporting()->subjectInsight($this->fixture("reporting-subject-insight-request.json"));
    }

    public function testDashboardReadsGenericPackDashboard(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-dashboard-security.json", $calls);

        $dashboard = $client->reporting()->dashboard("security_operations");

        self::assertSame("security_operations", $dashboard["key"]);
        self::assertSame("14d", $dashboard["defaultRange"]);
        self::assertSame(300, $dashboard["refreshSeconds"]);
        self::assertSame(["reporting:read"], $dashboard["requiredScopes"]);
        self::assertSame("security_events", $dashboard["widgets"][0]["template"]);
        self::assertSame(["event_count"], $dashboard["widgets"][0]["metrics"]);
        self::assertSame(["severity"], $dashboard["widgets"][0]["dimensions"]);
        self::assertSame("GET", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/dashboards/security_operations", $calls[0]["url"]);
    }

    public function testQueryReturnsTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-security-trust.json", $calls);

        $request = $this->fixture("reporting-query-security.json");
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
        self::assertSame("reviewed events", $widget["secondaryLabel"]);
        self::assertSame("auto", $widget["buckets"][0]["source"]);
        self::assertTrue($widget["buckets"][0]["complete"]);
        self::assertSame(42, $widget["buckets"][0]["queryDurationMs"]);
        self::assertSame(1, $widget["buckets"][0]["parquetUriCount"]);
        self::assertSame("healthy", $widget["trust"]["status"]);
        self::assertSame("healthy", $widget["trust"]["rollupState"]);
        self::assertSame("security-event/1.0.0", $widget["trust"]["schemaVersion"]);
        self::assertSame("complete", $widget["trust"]["coverage"]);
        self::assertSame("reporting.read", $widget["trust"]["permissionClass"]);
        self::assertSame([], $widget["trust"]["queryWarnings"]);
        self::assertSame("POST", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/query", $calls[0]["url"]);
        self::assertSame($request, $calls[0]["body"]);
    }

    public function testQuerySerializesMaxRowsWithoutRowLimit(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-security-trust.json", $calls);
        $request = $this->fixture("reporting-query-max-rows.json");

        $client->reporting()->query($request);

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
     * @param array<string, mixed> $response
     * @param list<array<string, mixed>> $calls
     */
    private function clientWithResponse(array $response, array &$calls, int $status = 200): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $response, $status): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => $status, "body" => json_encode($response, flags: JSON_THROW_ON_ERROR)];
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
