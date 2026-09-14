<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Analytics\Client as AnalyticsClient;
use HaakCo\Custd\Analytics\RequestException;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AnalyticsClientTest extends TestCase
{
    public function testQueriesTheTenantRouteAndSurfacesTheServerAssessment(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->response(), $calls);

        $response = $client->analytics()->query([
            "date" => "2026-09-14",
            "eventType" => "page_view",
            "limit" => 50,
        ]);

        // The tenant route, not the admin one: the credential already names the tenant.
        self::assertSame(["http://localhost:8080/api/v1/analytics/query"], array_column($calls, "url"));
        self::assertSame(["POST"], array_column($calls, "method"));
        // The server's own completeness and freshness assessment is surfaced verbatim;
        // the SDK must not substitute a confidence judgement of its own.
        self::assertTrue($response["sources"][0]["complete"]);
        self::assertTrue($response["sources"][0]["fresh"]);
        self::assertSame(20, $response["timing"]["eventLagP95Ms"]);
        self::assertSame([["eventTypeSlug" => "page_view", "payload" => ["path" => "/"]]], $response["results"]);
    }

    public function testSerialisesOnlyDocumentedPublicFields(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->response(), $calls);

        // anonymousId is an internal exact-subject predicate and countOnly is an internal
        // flag. Both are absent from the service's public JSON contract, so a caller must
        // not be able to smuggle them onto the wire by passing extra entries.
        $client->analytics()->query([
            "date" => "2026-09-14",
            "anonymousId" => "subject-1",
            "countOnly" => true,
        ]);

        self::assertSame(["date" => "2026-09-14"], $calls[0]["body"]);
    }

    public function testRejectsInvalidRequestsBeforeSending(): void
    {
        $tooMany = array_fill(0, AnalyticsClient::MAX_LABEL_FILTERS + 1, ["key" => "k", "value" => "v"]);
        $cases = [
            "missing date" => [],
            "too many label filters" => ["date" => "2026-09-14", "labelFilters" => $tooMany],
            "unknown source" => ["date" => "2026-09-14", "source" => "not-a-source"],
        ];

        foreach ($cases as $name => $request) {
            $calls = [];
            $client = $this->clientWithResponse($this->response(), $calls);

            try {
                $client->analytics()->query($request);
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls, "{$name} should not cost a request");
            }
        }
    }

    public function testUnavailablePreservesCanonicalProblem(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(
            ["detail" => "analytics unavailable", "code" => "analytics_unavailable", "retryability" => "bounded"],
            $calls,
            503,
        );

        try {
            $client->analytics()->query(["date" => "2026-09-14"]);
            self::fail("expected analytics RequestException");
        } catch (RequestException $error) {
            self::assertTrue($error->unavailable());
            self::assertSame(503, $error->status);
            self::assertSame("analytics_unavailable", $error->errorCode);
            self::assertSame("bounded", $error->retryability);
        }
    }

    /** @return array<string, mixed> */
    private function response(): array
    {
        return [
            "results" => [["eventTypeSlug" => "page_view", "payload" => ["path" => "/"]]],
            "count" => 1,
            "sources" => [[
                "name" => "postgres",
                "count" => 1,
                "complete" => true,
                "fresh" => true,
                "queryDurationMs" => 4,
                "freshnessLagMs" => 12,
            ]],
            "timing" => [
                "eventLagP50Ms" => 10,
                "eventLagP95Ms" => 20,
                "eventLagMaxMs" => 30,
                "queryDurationMs" => 4,
                "snapshotAgeMs" => 100,
            ],
        ];
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
}
