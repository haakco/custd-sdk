<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Analytics\Client as AnalyticsClient;
use HaakCo\Custd\Analytics\RangeQueryRequest;
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

        $response = $client->analytics()->queryRange(new RangeQueryRequest(
            from: "2026-09-14",
            to: "2026-09-15",
            eventType: "page_view",
            limit: 10000,
            source: "auto",
            groupBy: "day",
        ));

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

    public function testQueryRangeRejectsRetiredSourcesBeforeSending(): void
    {
        // The named DTO class must actually be loaded so the failure is the
        // intended validation exception, not a missing-class Error.
        self::assertTrue(class_exists(RangeQueryRequest::class));
        foreach (["postgres", "rollup", "materialized"] as $source) {
            $calls = [];
            $client = $this->clientWithResponse($this->rangeResponse(), $calls);

            try {
                $client->analytics()->queryRange(new RangeQueryRequest(
                    from: "2026-09-14",
                    to: "2026-09-15",
                    source: $source,
                ));
                self::fail("expected {$source} to be rejected");
            } catch (\InvalidArgumentException $error) {
                self::assertStringContainsString("source", $error->getMessage());
                self::assertSame([], $calls, "{$source} should not cost a request");
            }
        }
    }

    public function testQueryRangeRejectsEmptyObjectCollectionsButAcceptsEmptyLists(): void
    {
        // An empty JSON object {} must be rejected as a collection even though
        // PHP's associative decode would collapse it into an empty array. Only
        // an actual JSON array may stand in for a required collection.
        foreach (["rows", "buckets", "sources"] as $key) {
            $calls = [];
            $client = $this->clientWithResponse(array_merge($this->rangeResponse(), [$key => new \stdClass()]), $calls);

            try {
                $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-09-14", to: "2026-09-15"));
                self::fail("expected empty object {$key} to be rejected");
            } catch (\UnexpectedValueException $error) {
                self::assertStringContainsString($key, $error->getMessage());
                self::assertCount(1, $calls, "{$key} still performs the request");
            }
        }

        // A genuine [] collection stays a valid empty collection.
        $calls = [];
        $client = $this->clientWithResponse(
            array_merge($this->rangeResponse(), ["rows" => [], "buckets" => [], "sources" => []]),
            $calls
        );
        $response = $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-09-14", to: "2026-09-15"));
        self::assertSame([], $response->rows);
        self::assertSame([], $response->buckets);
        self::assertSame([], $response->sources);
    }

    public function testQueryRangeCollectionElementsMustBeObjects(): void
    {
        // A collection element must be a JSON object; a nested JSON array is not.
        $calls = [];
        $client = $this->clientWithResponse(array_merge($this->rangeResponse(), ["rows" => [[]]]), $calls);
        try {
            $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-09-14", to: "2026-09-15"));
            self::fail("expected a list row element to be rejected");
        } catch (\UnexpectedValueException $error) {
            self::assertStringContainsString("rows", $error->getMessage());
            self::assertCount(1, $calls);
        }

        // An empty {} column-bag object is a valid row element and stays an
        // (empty) associative array in the public DTO.
        $calls = [];
        $client = $this->clientWithResponse(array_merge($this->rangeResponse(), ["rows" => [new \stdClass()]]), $calls);
        $response = $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-09-14", to: "2026-09-15"));
        self::assertSame([[]], $response->rows);
    }

    public function testQueryRangeRejectsAnEmptySuccessBody(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => 200, "body" => ""];
            },
        ]);

        try {
            $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-09-14", to: "2026-09-15"));
            self::fail("expected an empty body to be rejected");
        } catch (\UnexpectedValueException $error) {
            self::assertStringContainsString("must be a JSON object", $error->getMessage());
            self::assertCount(1, $calls);
        }
    }

    public function testQueryRangeRejectsMalformedSuccessBodies(): void
    {
        $base = $this->rangeResponse();
        $malformed = [
            "empty object" => [],
            "missing rows" => array_diff_key($base, ["rows" => true]),
            "rows not a list" => array_merge($base, ["rows" => ["unexpected" => $base["rows"]]]),
            "sources not a list" => array_merge($base, ["sources" => ["unexpected" => $base["sources"]]]),
            "missing timing" => array_diff_key($base, ["timing" => true]),
            "timing missing field" => array_merge($base, [
                "timing" => array_diff_key($base["timing"], ["snapshotAgeMs" => true]),
            ]),
            "bucket missing flag" => array_merge($base, [
                "buckets" => [array_diff_key($base["buckets"][0], ["complete" => true])],
            ]),
            "source missing flag" => array_merge($base, [
                "sources" => [array_diff_key($base["sources"][0], ["fresh" => true])],
            ]),
            "wrong field type" => array_merge($base, ["count" => "3"]),
        ];

        foreach ($malformed as $name => $body) {
            $calls = [];
            $client = $this->clientWithResponse($body, $calls);

            try {
                $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-09-14", to: "2026-09-15"));
                self::fail("expected {$name} to be rejected");
            } catch (\UnexpectedValueException) {
                self::assertCount(1, $calls, "{$name} still performs the request");
            }
        }
    }

    public function testQueryRangeRejectsInvalidRangesBeforeSending(): void
    {
        $tooMany = array_fill(0, AnalyticsClient::MAX_LABEL_FILTERS + 1, ["key" => "k", "value" => "v"]);
        $cases = [
            "malformed from" => ["from" => "14-09-2026", "to" => "2026-09-15"],
            "impossible day" => ["from" => "2026-02-30", "to" => "2026-03-01"],
            "compact date" => ["from" => "20260914", "to" => "2026-09-15"],
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
                $client->analytics()->queryRange(new RangeQueryRequest(...$request));
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls, "{$name} should not cost a request");
            }
        }
    }

    public function testQueryRangeAcceptsAnEmptySourceAsTheDefault(): void
    {
        // The range contract accepts an omitted, empty, auto, or duckdb source.
        // A present empty string is normalized to an omitted wire field, matching
        // the Go SDK's omitempty tag.
        $calls = [];
        $client = $this->clientWithResponse($this->rangeResponse(), $calls);

        $client->analytics()->queryRange(new RangeQueryRequest(
            from: "2026-09-14",
            to: "2026-09-15",
            source: "",
        ));

        self::assertSame(["from" => "2026-09-14", "to" => "2026-09-15"], $calls[0]["body"]);
    }

    public function testQueryRangeAcceptsARangeAtExactlyTheDayCap(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->rangeResponse(), $calls);

        // 2026-01-01..2026-04-30 is 120 inclusive days, the documented maximum.
        $client->analytics()->queryRange(new RangeQueryRequest(from: "2026-01-01", to: "2026-04-30"));

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
