<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Admin\Usage\Query;
use HaakCo\Custd\Admin\Usage\Report;
use HaakCo\Custd\Admin\UsageClient;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class UsageClientTest extends TestCase
{
    public function testReadsTheCurrentTenantUsage(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->report(), $calls);

        $report = $client->adminUsage()->get();

        self::assertSame(["http://localhost:8080/api/v1/admin/usage/me"], array_column($calls, "url"));
        self::assertSame(["GET"], array_column($calls, "method"));
        self::assertSame("admin-token", $calls[0]["token"]);
        // The tenant is derived from the credential, so no company slug is sent.
        self::assertNull($calls[0]["body"]);
        self::assertInstanceOf(Report::class, $report);
        self::assertSame("usage.v1", $report->schemaVersion);
        self::assertSame("acme", $report->companySlug);
        self::assertSame(42, $report->rows[0]->quantity);
        self::assertSame("final", $report->rows[0]->completenessState);
        self::assertSame("events.ingested", $report->totals[0]->meterSlug);
        self::assertFalse($report->containsProvisional);
        self::assertFalse($report->containsIncomplete);
    }

    public function testEncodesTheMeterWindowAndLimit(): void
    {
        $calls = [];
        $client = $this->clientWithResponse($this->report(), $calls);

        $client->adminUsage()->get(new Query(
            meterSlug: "events.ingested",
            start: "2026-09-01T00:00:00Z",
            end: "2026-10-01T00:00:00Z",
            limit: 100,
        ));

        self::assertSame(
            "http://localhost:8080/api/v1/admin/usage/me"
            . "?end=2026-10-01T00%3A00%3A00Z&limit=100&meter=events.ingested&start=2026-09-01T00%3A00%3A00Z",
            $calls[0]["url"]
        );
    }

    public function testRejectsEmptyObjectCollectionsButAcceptsEmptyLists(): void
    {
        // An empty JSON object {} must be rejected as a collection even though
        // PHP's associative decode would collapse it into an empty array. Only
        // an actual JSON array may stand in for a required collection.
        foreach (["rows", "totals"] as $key) {
            $calls = [];
            $client = $this->clientWithResponse(array_merge($this->report(), [$key => new \stdClass()]), $calls);

            try {
                $client->adminUsage()->get();
                self::fail("expected empty object {$key} to be rejected");
            } catch (\UnexpectedValueException $error) {
                self::assertStringContainsString($key, $error->getMessage());
                self::assertCount(1, $calls, "{$key} still performs the request");
            }
        }

        // A genuine [] collection stays a valid empty collection.
        $calls = [];
        $client = $this->clientWithResponse(
            array_merge($this->report(), ["rows" => [], "totals" => []]),
            $calls
        );
        $report = $client->adminUsage()->get();
        self::assertSame([], $report->rows);
        self::assertSame([], $report->totals);
    }

    public function testUsageCollectionElementsMustBeObjects(): void
    {
        // A collection element must be a JSON object; a nested JSON array is not,
        // even though it is empty.
        $calls = [];
        $client = $this->clientWithResponse(array_merge($this->report(), ["rows" => [[]]]), $calls);
        try {
            $client->adminUsage()->get();
            self::fail("expected a list row element to be rejected");
        } catch (\UnexpectedValueException $error) {
            self::assertStringContainsString("rows", $error->getMessage());
            self::assertCount(1, $calls);
        }
    }

    public function testRejectsAnEmptySuccessBody(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => 200, "body" => ""];
            },
        ]);

        try {
            $client->adminUsage()->get();
            self::fail("expected an empty body to be rejected");
        } catch (\UnexpectedValueException $error) {
            self::assertStringContainsString("must be a JSON object", $error->getMessage());
            self::assertCount(1, $calls);
        }
    }

    public function testRejectsAnInvalidWindowOrLimitBeforeSending(): void
    {
        $cases = [
            "start not before end" => ["start" => "2026-10-01T00:00:00Z", "end" => "2026-10-01T00:00:00Z"],
            "malformed instant" => ["start" => "not-a-timestamp"],
            "missing offset" => ["end" => "2026-10-01T00:00:00"],
            "date only" => ["start" => "2026-09-01"],
            "space separated" => ["start" => "2026-09-01 00:00:00+00:00"],
            "normalized february 30" => ["start" => "2026-02-30T00:00:00Z"],
            // \DateTimeImmutable normalizes hour 24 and leap-second 60, so the
            // preflight must bound hours, minutes, and seconds itself.
            "normalized hour 24" => ["start" => "2026-09-01T24:00:00Z"],
            "leap second" => ["start" => "2026-09-01T23:59:60Z"],
            "limit zero" => ["limit" => 0],
            "limit above maximum" => ["limit" => UsageClient::MAX_LIMIT + 1],
        ];

        foreach ($cases as $name => $query) {
            $calls = [];
            $client = $this->clientWithResponse($this->report(), $calls);

            try {
                $client->adminUsage()->get(new Query(...$query));
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls, "{$name} should not cost a request");
            }
        }
    }

    public function testRejectsMalformedSuccessBodies(): void
    {
        $base = $this->report();
        $malformed = [
            "empty object" => [],
            "missing completeness flag" => array_diff_key($base, ["containsIncomplete" => true]),
            "missing rows" => array_diff_key($base, ["rows" => true]),
            "rows not a list" => array_merge($base, ["rows" => ["unexpected" => $base["rows"]]]),
            "totals null" => array_merge($base, ["totals" => null]),
            "wrong field type" => array_merge($base, ["containsProvisional" => "false"]),
        ];

        foreach ($malformed as $name => $body) {
            $calls = [];
            $client = $this->clientWithResponse($body, $calls);

            try {
                $client->adminUsage()->get();
                self::fail("expected {$name} to be rejected");
            } catch (\UnexpectedValueException) {
                self::assertCount(1, $calls, "{$name} still performs the request");
            }
        }
    }

    /** @return array<string, mixed> */
    private function report(): array
    {
        return [
            "schemaVersion" => "usage.v1",
            "companySlug" => "acme",
            "start" => "2026-09-01T00:00:00Z",
            "end" => "2026-10-01T00:00:00Z",
            "rows" => [[
                "accountCompanySlug" => "acme",
                "dataSpaceCompanySlug" => "acme-web",
                "meterSlug" => "events.ingested",
                "meterVersion" => 1,
                "unit" => "event",
                "windowStart" => "2026-09-01T00:00:00Z",
                "windowEnd" => "2026-09-02T00:00:00Z",
                "quantity" => 42,
                "sourceWatermark" => 100,
                "completenessState" => "final",
                "correctionGeneration" => 0,
                "calculationVersion" => 1,
            ]],
            "totals" => [[
                "accountCompanySlug" => "acme",
                "dataSpaceCompanySlug" => "acme-web",
                "meterSlug" => "events.ingested",
                "unit" => "event",
                "quantity" => 42,
            ]],
            "sourceWatermark" => 100,
            "containsProvisional" => false,
            "containsIncomplete" => false,
        ];
    }

    /**
     * @param array<string, mixed> $response
     * @param list<array<string, mixed>> $calls
     */
    private function clientWithResponse(array $response, array &$calls): CustdClient
    {
        return new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls, $response): array {
                $calls[] = compact("method", "url", "body", "token");

                return ["status" => 200, "body" => json_encode($response, flags: JSON_THROW_ON_ERROR)];
            },
        ]);
    }
}
