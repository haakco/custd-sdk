<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

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

        $client->adminUsage()->get([
            "meterSlug" => "events.ingested",
            "start" => "2026-09-01T00:00:00Z",
            "end" => "2026-10-01T00:00:00Z",
            "limit" => 100,
        ]);

        self::assertSame(
            "http://localhost:8080/api/v1/admin/usage/me"
            . "?end=2026-10-01T00%3A00%3A00Z&limit=100&meter=events.ingested&start=2026-09-01T00%3A00%3A00Z",
            $calls[0]["url"]
        );
    }

    public function testRejectsAnInvalidWindowOrLimitBeforeSending(): void
    {
        $cases = [
            "start not before end" => ["start" => "2026-10-01T00:00:00Z", "end" => "2026-10-01T00:00:00Z"],
            "malformed instant" => ["start" => "not-a-timestamp"],
            "missing offset" => ["end" => "2026-10-01T00:00:00"],
            "limit zero" => ["limit" => 0],
            "limit above maximum" => ["limit" => UsageClient::MAX_LIMIT + 1],
        ];

        foreach ($cases as $name => $query) {
            $calls = [];
            $client = $this->clientWithResponse($this->report(), $calls);

            try {
                $client->adminUsage()->get($query);
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                self::assertSame([], $calls, "{$name} should not cost a request");
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
