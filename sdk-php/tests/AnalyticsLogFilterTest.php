<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Analytics\RangeQueryRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AnalyticsLogFilterTest extends TestCase
{
    public function testQuerySerialisesTheFourPromotedFilters(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->response(), $calls);

        $client->analytics()->query([
            "date" => "2026-09-14",
            "severity" => "error",
            "service" => "checkout-api",
            "subClient" => "acme-store",
            "resource" => "srv-1",
        ]);

        self::assertSame("error", $calls[0]["body"]["severity"]);
        self::assertSame("checkout-api", $calls[0]["body"]["service"]);
        self::assertSame("acme-store", $calls[0]["body"]["subClient"]);
        self::assertSame("srv-1", $calls[0]["body"]["resource"]);
    }

    public function testQueryOmitsAnEmptyFilter(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->response(), $calls);

        $client->analytics()->query(["date" => "2026-09-14", "severity" => ""]);

        self::assertSame(["date" => "2026-09-14"], $calls[0]["body"]);
    }

    public function testRangeQuerySerialisesThePromotedFilters(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->rangeResponse(), $calls);

        $client->analytics()->queryRange(new RangeQueryRequest(
            from: "2026-09-14",
            to: "2026-09-15",
            severity: "error",
            subClient: "acme-store",
        ));

        self::assertSame("error", $calls[0]["body"]["severity"]);
        self::assertSame("acme-store", $calls[0]["body"]["subClient"]);
        self::assertArrayNotHasKey("service", $calls[0]["body"]);
    }

    /**
     * @return array<string, mixed>
     */
    private function response(): array
    {
        return [
            "results" => [],
            "count" => 0,
            "sources" => [],
            "timing" => [
                "eventLagP50Ms" => 0,
                "eventLagP95Ms" => 0,
                "eventLagMaxMs" => 0,
                "queryDurationMs" => 0,
                "snapshotAgeMs" => 0,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rangeResponse(): array
    {
        return [
            "rows" => [],
            "count" => 0,
            "buckets" => [],
            "sources" => [],
            "timing" => [
                "eventLagP50Ms" => 0,
                "eventLagP95Ms" => 0,
                "eventLagMaxMs" => 0,
                "queryDurationMs" => 0,
                "snapshotAgeMs" => 0,
            ],
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $calls
     */
    private function clientWithResponse(mixed $response, array &$calls): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $response): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => 200, "body" => json_encode($response, JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
