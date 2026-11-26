<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Reporting\Data\ExportQueryParameters;
use HaakCo\Custd\Reporting\Data\ReportExportCancelRequest;
use HaakCo\Custd\Reporting\Data\ReportExportCreateRequest;
use HaakCo\Custd\Reporting\Data\ReportingQueryDocument;
use HaakCo\Custd\Reporting\Data\ReportingQueryRequest;
use HaakCo\Custd\Reporting\Data\SubjectInsightRequest;
use HaakCo\Custd\Reporting\RequestException;
use PHPUnit\Framework\TestCase;

final class ReportingClientTest extends TestCase
{
    public function testUnavailablePreservesCanonicalProblem(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->fixture("reporting-unavailable-problem.json"), $calls, 503);

        try {
            $client->reporting()->dashboard("executive");
            self::fail("expected reporting RequestException");
        } catch (RequestException $error) {
            self::assertTrue($error->unavailable());
            self::assertSame(503, $error->status);
            self::assertSame("reporting_unavailable", $error->errorCode);
            self::assertSame("bounded", $error->retryability);
            self::assertSame("retry", $error->nextAction["action"]);
        }
    }

    public function testReportExportLifecycleUsesAuthenticatedRoutes(): void
    {
        $id = "123e4567-e89b-42d3-a456-426614174000";
        $calls = [];
        $client = $this->clientWithResponse($this->maximal("getReportExport"), $calls);
        $created = $client->reporting()->createExport(new ReportExportCreateRequest("executive", ["csv"], new ExportQueryParameters(rangeDays: 7)));
        $client->reporting()->getExport($id);
        $client->reporting()->cancelExport($id, new ReportExportCancelRequest("done"));
        self::assertSame("example", $created->id);
        self::assertSame(["dashboardKey" => "executive", "formats" => ["csv"], "parameters" => ["rangeDays" => 7]], $calls[0]["body"]);
        self::assertSame(["reason" => "done"], $calls[2]["body"]);
        self::assertSame([
            "http://localhost:8080/api/v1/reporting/exports",
            "http://localhost:8080/api/v1/reporting/exports/{$id}",
            "http://localhost:8080/api/v1/reporting/exports/{$id}/cancel",
        ], array_column($calls, "url"));
    }
    public function testOutputSelectsCanonicalReadyOutput(): void
    {
        $uuid = "33333333-3333-4333-8333-333333333333";
        $calls = [];
        $client = $this->clientWithResponse($this->maximal("getPreparedDataOutput"), $calls);
        self::assertSame("accepted", $client->reporting()->output($uuid)->processingState);
        self::assertSame("http://localhost:8080/api/v1/reporting/outputs/{$uuid}", $calls[0]["url"]);
    }

    public function testOutputsPreservesNullableListEnvelope(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["outputs" => null], $calls);
        self::assertSame([], $client->reporting()->outputs()->outputs);
        $output = $this->maximal("getPreparedDataOutput");
        $output["warnings"] = null;
        $client = $this->clientWithResponse(["outputs" => [$output]], $calls);
        self::assertSame([], $client->reporting()->outputs()->outputs[0]->warnings);
    }

    public function testSubjectInsightSendsClosedRequestAndReturnsRenderedData(): void
    {
        $calls = [];
        $response = $this->fixture("reporting-subject-insight-response.json");
        foreach (["reporting-subject-insight-request.json", "reporting-subject-insight-date-range-request.json"] as $fixture) {
            $calls = [];
            $client = $this->clientWithFixture("reporting-subject-insight-response.json", $calls);
            $request = $this->fixture($fixture);

            $result = $client->reporting()->subjectInsight(new SubjectInsightRequest(...$request));

            self::assertSame((float) $response["data"]["value"]["value"], $result->data->value->value);
            self::assertSame("POST", $calls[0]["method"]);
            self::assertSame("http://localhost:8080/api/v1/reporting/insights/subject", $calls[0]["url"]);
            self::assertEquals($request, $calls[0]["body"]);
        }
    }

    public function testSubjectInsightRejectsInvalidSubjectAndRange(): void
    {
        foreach ([
            new SubjectInsightRequest(subject: " ", template: "subject_activity", rangeDays: 7),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", from: "2026-07-01T00:00:00Z"),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", from: "2026-07-01T00:00:00Z", rangeDays: 18, to: "2026-07-18T00:00:00Z"),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "Invalid", rangeDays: 7),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", from: "2026-07-18T00:00:00Z", to: "2026-07-01T00:00:00Z"),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", rangeDays: 0),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", from: "2026-02-30T00:00:00Z", to: "2026-03-01T00:00:00Z"),
            new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", from: "2026-02-01T00:00Z", to: "2026-03-01T00:00:00Z"),
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

        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionMessage("response field value is required");
        $client->reporting()->subjectInsight(new SubjectInsightRequest(subject: "subject_7f3b", template: "subject_activity", rangeDays: 7));
    }

    public function testSubjectInsightRejectsUnsafeTrustDiagnostics(): void
    {
        $calls = [];
        $response = $this->fixture("reporting-subject-insight-response.json");
        $response["data"]["trust"] = ["token" => "secret"];
        $client = $this->clientWithResponse($response, $calls);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("unsafe reporting trust diagnostics");
        $client->reporting()->subjectInsight($this->subjectRequest());
    }

    public function testSubjectInsightRejectsMalformedOptionalRenderedData(): void
    {
        $calls = [];
        $response = $this->fixture("reporting-subject-insight-response.json");
        $response["data"]["metadata"] = ["resolvedTemplate" => "learning_subject"];
        $client = $this->clientWithResponse($response, $calls);

        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionMessage("response field coveredWindows is required");
        $client->reporting()->subjectInsight($this->subjectRequest());
    }

    public function testSubjectInsightPropagatesReportingAuthError(): void
    {
        $calls = [];
        $client = $this->clientWithResponse([], $calls, 403);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("status 403");
        $client->reporting()->subjectInsight($this->subjectRequest());
    }

    public function testDashboardReadsGenericPackDashboard(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-dashboard-security.json", $calls);

        $dashboard = $client->reporting()->dashboard("security_operations");

        self::assertSame("security_operations", $dashboard->key);
        self::assertSame("14d", $dashboard->defaultRange);
        self::assertSame(300, $dashboard->refreshSeconds);
        self::assertSame(["reporting:read"], $dashboard->requiredScopes);
        self::assertSame("security_events", $dashboard->widgets[0]->template);
        self::assertSame(["event_count"], $dashboard->widgets[0]->metrics);
        self::assertSame(["severity"], $dashboard->widgets[0]->dimensions);
        self::assertSame("GET", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/dashboards/security_operations", $calls[0]["url"]);
    }

    public function testQueryReturnsTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-rendered.json", $calls);

        $request = $this->fixture("reporting-query-security.json");
        $widget = $client->reporting()->query(new ReportingQueryRequest(...$request));

        self::assertSame(50.0, $widget->value->value);
        self::assertSame(50, $widget->value->sampleCount);
        self::assertTrue($widget->value->complete);
        self::assertFalse($widget->value->truncated);
        self::assertSame(42, $widget->queryDurationMs);
        self::assertSame(1, $widget->parquetUriCount);
        self::assertSame(120000, $widget->snapshotAgeMs);
        self::assertSame(8000, $widget->eventLagP95Ms);
        self::assertSame(25.0, $widget->delta?->value);
        self::assertSame(100.0, $widget->deltaPercent);
        self::assertSame("vs previous period", $widget->deltaLabel);
        self::assertSame("auto", $widget->buckets[0]->source);
        self::assertTrue($widget->buckets[0]->value->complete);
        self::assertSame(42, $widget->buckets[0]->queryDurationMs);
        self::assertSame(1, $widget->buckets[0]->parquetUriCount);
        self::assertSame("healthy", $widget->trust?->status);
        self::assertSame("complete", $widget->trust->rollupState);
        self::assertSame("none", $widget->trust->retryability);
        self::assertSame("none", $widget->trust->nextAction->action);
        self::assertSame("security-event/1.0.0", $widget->trust->schemaVersion);
        self::assertSame("complete", $widget->trust->coverage);
        self::assertSame("reporting.read", $widget->trust->permissionClass);
        self::assertSame([], $widget->trust->queryWarnings);
        self::assertSame("POST", $calls[0]["method"]);
        self::assertSame("http://localhost:8080/api/v1/reporting/query", $calls[0]["url"]);
        self::assertEquals($request, $calls[0]["body"]);
    }

    /** A caller's own query document is sent byte for byte, so an empty object stays an object. */
    public function testPreparedDataQuerySendsTheCallersDocumentVerbatim(): void
    {
        $document = '{"metrics":["sessions"],"template":"kpi_tiles","filters":[],"options":{}}';
        $sent = [];
        $envelope = (string) json_encode($this->maximal("queryPreparedDataOutput"), JSON_THROW_ON_ERROR);
        $client = new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => static function (string $method, string $url, array|string|null $body) use (&$sent, $envelope): array {
                $sent[] = $body;

                return ["status" => 200, "body" => $envelope];
            },
        ]);

        $client->reporting()->queryOutput("01957abc-0000-4000-8000-000000000001", ReportingQueryDocument::fromJson($document));

        self::assertSame([$document], $sent);
        $this->expectException(\InvalidArgumentException::class);
        ReportingQueryDocument::fromJson('["not", "an", "object"]');
    }

    public function testQuerySerializesMaxRowsWithoutRowLimit(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-rendered.json", $calls);
        $request = $this->fixture("reporting-query-max-rows.json");

        $client->reporting()->query(new ReportingQueryRequest(...$request));

        self::assertEquals($request, $calls[0]["body"]);
        self::assertSame(50, $calls[0]["body"]["maxRows"]);
        self::assertArrayNotHasKey("rowLimit", $calls[0]["body"]);
    }

    public function testQueryRejectsUnsafeTrustDiagnostics(): void
    {
        $calls = [];
        $client = $this->clientWithFixture("reporting-query-unsafe-trust.json", $calls);

        try {
            $client->reporting()->query(new ReportingQueryRequest(metrics: ["flow_completion_rate"], template: "awthy_secure_checkout_flow", rangeDays: 1));
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

    private function subjectRequest(): SubjectInsightRequest
    {
        return new SubjectInsightRequest(...$this->fixture("reporting-subject-insight-request.json"));
    }

    /** @return array<string, mixed> */
    private function maximal(string $operationId): array
    {
        return $this->fixture("api/examples/{$operationId}.json")["maximal"];
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
