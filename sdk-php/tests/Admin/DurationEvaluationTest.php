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
        $this->assertSame("duration-forecast-evaluation.v1", $response->artifact->schemaVersion);
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

    /** artifactBody is the server-shaped evaluation example with the version evidence this test asserts. */
    private function artifactBody(): string
    {
        $example = json_decode((string) file_get_contents(__DIR__ . "/../../../contract-fixtures/api/examples/evaluateDurationHistory.json"), false, 512, JSON_THROW_ON_ERROR);
        $body = $example->maximal;
        $body->definitionUuid = "definition-1";
        $body->planUuid = "plan-1";
        $body->semanticKey = "build_step";
        $body->outcomes->eligible = 5;
        $body->outcomes->censored = 1;
        $body->artifact->schema_version = "duration-forecast-evaluation.v1";
        $body->versionEvidence->selected->uuid = "version-1";
        $body->versionEvidence->selected->versionNumber = 3;
        $body->versionEvidence->activeVersionUuid = "version-1";

        return json_encode($body, JSON_THROW_ON_ERROR);
    }
}
