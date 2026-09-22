<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Admin\Prediction\DurationEvaluationRequest;
use PHPUnit\Framework\TestCase;

/**
 * The typed duration-evaluation operation is the SDK half of the duration
 * prediction contract: a caller supplies one tenant-scoped history request and
 * reads prediction error, interval containment and version provenance from named
 * fields.
 */
final class DurationEvaluationTest extends TestCase
{
    public function testDurationEvaluationSendsTypedRequestBody(): void
    {
        $calls = [];
        $client = $this->client($calls, $this->artifactBody());

        $response = $client->adminMeasurementPredictions()->evaluateDurationHistory(
            "acme",
            "definition-1",
            new DurationEvaluationRequest(
                planUuid: "plan-1",
                semanticKey: "build_step",
                windowStart: "2026-06-24T00:00:00Z",
                asOf: "2026-09-22T00:00:00Z",
                limit: 128,
            ),
        );

        $this->assertSame("POST", $calls[0]["method"]);
        $this->assertSame(
            "http://localhost:8080/api/v1/admin/measurement/predictions/definitions/definition-1/duration-evaluations?companySlug=acme",
            $calls[0]["url"],
        );
        $this->assertSame("plan-1", $calls[0]["body"]["planUuid"]);
        $this->assertSame("build_step", $calls[0]["body"]["semanticKey"]);
        $this->assertSame(128, $calls[0]["body"]["limit"]);
        // An unselected version is omitted rather than sent as an empty string,
        // so the server keeps using the active version.
        $this->assertArrayNotHasKey("predictionVersionUuid", $calls[0]["body"]);

        $this->assertSame("definition-1", $response->definitionUuid);
        $this->assertSame("plan-1", $response->planUuid);
        $this->assertSame("build_step", $response->semanticKey);
        $this->assertSame(5, $response->outcomes->eligible);
        $this->assertSame(1, $response->outcomes->censored);
        $this->assertSame("version-1", $response->versionEvidence->selected->uuid);
        $this->assertSame("version-1", $response->versionEvidence->activeVersionUuid);
        $this->assertSame(3, $response->versionEvidence->selected->versionNumber);
        $this->assertSame("duration-forecast-evaluation.v1", $response->artifact["schema_version"]);
    }

    public function testDurationEvaluationSendsAnExplicitVersionWhenSelected(): void
    {
        $calls = [];
        $client = $this->client($calls, $this->artifactBody());

        $client->adminMeasurementPredictions()->evaluateDurationHistory(
            "acme",
            "definition-1",
            new DurationEvaluationRequest(
                planUuid: "plan-1",
                semanticKey: "build_step",
                predictionVersionUuid: "version-9",
            ),
        );

        $this->assertSame("version-9", $calls[0]["body"]["predictionVersionUuid"]);
        $this->assertArrayNotHasKey("limit", $calls[0]["body"]);
    }

    /**
     * @param list<array{method: string, url: string, body: array<string, mixed>}> $calls
     * @return CustdClient
     */
    private function client(array &$calls, string $body): CustdClient
    {
        return new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => static function (string $method, string $url, ?array $payload) use (&$calls, $body): array {
                $calls[] = ["method" => $method, "url" => $url, "body" => $payload ?? []];
                return ["status" => 200, "body" => $body];
            },
        ]);
    }

    private function artifactBody(): string
    {
        return json_encode([
            "definitionUuid" => "definition-1",
            "planUuid" => "plan-1",
            "semanticKey" => "build_step",
            "artifact" => [
                "schema_version" => "duration-forecast-evaluation.v1",
                "source" => "measurement.duration_forecast_evaluation",
                "prediction_version_uuid" => "version-1",
                "evaluation" => ["folds" => []],
                "content_sha256" => str_repeat("a", 64),
            ],
            "outcomes" => ["eligible" => 5, "skipped" => 0, "cancelled" => 0, "notRun" => 0, "censored" => 1],
            "versionEvidence" => [
                "selected" => [
                    "uuid" => "version-1",
                    "versionNumber" => 3,
                    "status" => "active",
                    "createdAt" => "2026-09-01T00:00:00Z",
                ],
                "activeVersionUuid" => "version-1",
                "history" => ["items" => []],
            ],
        ], JSON_THROW_ON_ERROR);
    }
}
