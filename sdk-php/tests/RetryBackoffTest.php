<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * Retry backoff sleeps in-thread by default. Synchronous callers (e.g. a
 * WordPress request hook) can stall page render while the retry loop sleeps, so
 * the client exposes a `sleeper` seam to opt out of in-thread blocking.
 */
final class RetryBackoffTest extends TestCase
{
    public function testBackoffInvokesInjectedSleeperBetweenRetries(): void
    {
        $delays = [];
        $client = $this->clientWithResponses(
            [["status" => 503, "body" => ""], ["status" => 202, "body" => ""]],
            sleeper: function (int $delayMs) use (&$delays): void {
                $delays[] = $delayMs;
            },
        );

        $result = $client->ingestEvent($this->validEvent());

        $this->assertSame(202, $result["status"]);
        $this->assertCount(1, $delays, "One retry should trigger exactly one backoff.");
        $this->assertGreaterThan(0, $delays[0]);
    }

    public function testNoOpSleeperStillRetriesWithoutBlocking(): void
    {
        $calls = 0;
        $client = $this->clientWithResponses(
            [["status" => 503, "body" => ""], ["status" => 202, "body" => ""]],
            sleeper: static fn (int $delayMs): null => null,
            onCall: function () use (&$calls): void {
                $calls++;
            },
        );

        $result = $client->ingestEvent($this->validEvent());

        $this->assertSame(202, $result["status"]);
        $this->assertSame(2, $calls, "A no-op sleeper must still allow the retry to run.");
    }

    /**
     * @param list<array{status:int, body:string}> $responses
     */
    private function clientWithResponses(array $responses, callable $sleeper, ?callable $onCall = null): CustdClient
    {
        $index = 0;

        return new CustdClient("https://custd.example.com", "token", [
            "retry" => ["base_delay_ms" => 5, "sleeper" => $sleeper],
            "http_client" => function () use (&$index, $responses, $onCall): array {
                if ($onCall !== null) {
                    $onCall();
                }
                $response = $responses[$index] ?? end($responses);
                $index++;
                return $response;
            },
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validEvent(): array
    {
        return [
            "eventUuid" => "evt-1",
            "eventTypeSlug" => "page-view",
            "schemaVersion" => "1.0.0",
            "timestamp" => "2026-01-24T00:00:00Z",
            "sessionId" => "sess-1",
            "anonymousId" => "anon-1",
            "companySlug" => "acme",
            "context" => ["device" => ["type" => "server"]],
            "payload" => ["path" => "/"],
        ];
    }
}
