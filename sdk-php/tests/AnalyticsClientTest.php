<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Analytics\Client as AnalyticsClient;
use HaakCo\Custd\Analytics\RangeQueryResponse;
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

    public function testQueryRangeUsesTheRangeRouteAndSurfacesTypedBuckets(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->rangeResponse(), $calls);

        $response = $client->analytics()->queryRange([
            "from" => "2026-09-14",
            "to" => "2026-09-15",
            "eventType" => "page_view",
            "limit" => 10000,
            "source" => "auto",
            "groupBy" => "day",
        ]);

        self::assertSame(["http://localhost:8080/api/v1/analytics/query-range"], array_column($calls, "url"));
        self::assertSame(["POST"], array_column($calls, "method"));
        self::assertSame(
            [
                "from" => "2026-09-14",
                "to" => "2026-09-15",
                "eventType" => "page_view",
                "limit" => 10000,
                "source" => "auto",
                "groupBy" => "day",
            ],
            $calls[0]["body"],
        );
        self::assertInstanceOf(RangeQueryResponse::class, $response);
        self::assertSame(3, $response->count);
        self::assertCount(2, $response->buckets);
        self::assertTrue($response->buckets[0]->complete);
        self::assertSame(2, $response->buckets[0]->parquetUriCount);
        self::assertSame(4, $response->timing->queryDurationMs);
        self::assertSame([["eventTypeSlug" => "page_view", "payload" => ["path" => "/"]]], $response->rows);
    }

    public function testQueryRangeRejectsInvalidRangesBeforeSending(): void
    {
        $tooMany = array_fill(0, AnalyticsClient::MAX_LABEL_FILTERS + 1, ["key" => "k", "value" => "v"]);
        $cases = [
            "missing bounds" => [],
            "malformed from" => ["from" => "14-09-2026", "to" => "2026-09-15"],
            "impossible day" => ["from" => "2026-02-30", "to" => "2026-03-01"],
            "to before from" => ["from" => "2026-09-15", "to" => "2026-09-14"],
            "over the day cap" => ["from" => "2026-01-01", "to" => "2026-05-02"],
            "unsupported groupBy" => ["from" => "2026-09-14", "to" => "2026-09-15", "groupBy" => "week"],
            "too many label filters" => [
                "from" => "2026-09-14",
                "to" => "2026-09-15",
                "labelFilters" => $tooMany,
            ],
            "unknown source" => ["from" => "2026-09-14", "to" => "2026-09-15", "source" => "nope"],
        ];

        foreach ($cases as $name => $request) {
            $calls = [];
            $client = $this->clientWithResponse($this->rangeResponse(), $calls);

            try {
                $client->analytics()->queryRange($request);
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls, "{$name} should not cost a request");
            }
        }
    }

    public function testQueryRangeAcceptsARangeAtExactlyTheDayCap(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->rangeResponse(), $calls);

        // 2026-01-01..2026-04-30 is 120 inclusive days, the documented maximum.
        $client->analytics()->queryRange(["from" => "2026-01-01", "to" => "2026-04-30"]);

        self::assertCount(1, $calls);
    }

    /** @return array<string, mixed> */
    private function rangeResponse(): array
    {
        $response = $this->response();
        $response["rows"] = $response["results"];
        unset($response["results"]);
        $response["count"] = 3;
        $response["buckets"] = [
            [
                "date" => "2026-09-14",
                "count" => 1,
                "source" => "duckdb",
                "complete" => true,
                "queryDurationMs" => 4,
                "parquetUriCount" => 2,
            ],
            [
                "date" => "2026-09-15",
                "count" => 2,
                "source" => "duckdb",
                "complete" => true,
                "queryDurationMs" => 5,
            ],
        ];

        return $response;
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
