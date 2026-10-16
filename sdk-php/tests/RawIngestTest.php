<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\RawAcceptanceUnknownException;
use HaakCo\Custd\RawIngest\RawIngestRequest;
use HaakCo\Custd\RawIngest\RawRequestIdempotencyKey;
use HaakCo\Custd\RawIngest\RawSourceTarget;
use HaakCo\Custd\RetryableException;
use PHPUnit\Framework\TestCase;

final class RawIngestTest extends TestCase
{
    private const PARSER_UUID = "11111111-1111-1111-1111-111111111111";

    public function testPostsTheRawBodyWithTheParserBinding(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["success" => true, "processed" => 2, "failed" => 0], $calls);

        $result = $client->ingestRawLines(new RawIngestRequest("first line\nsecond line\n", self::PARSER_UUID));

        self::assertSame("http://localhost:8080/api/v1/raw", $calls[0]["url"]);
        self::assertSame("first line\nsecond line\n", $calls[0]["payload"]);
        // The callback receives the request headers, so the parser binding and the
        // raw content type are transmittable through a custom transport.
        self::assertSame(self::PARSER_UUID, $calls[0]["headers"]["X-Parser-UUID"]);
        self::assertSame("text/plain; charset=utf-8", $calls[0]["headers"]["Content-Type"]);
        // A 202 alone is not success: the body carries the per-record counts.
        self::assertTrue($result->success);
        self::assertSame(2, $result->processed);
        self::assertSame(0, $result->failed);
    }

    public function testAppendsThePairedSourceTarget(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["success" => true, "processed" => 3, "failed" => 1], $calls);

        $result = $client->ingestRawLines(new RawIngestRequest(
            "line\n",
            self::PARSER_UUID,
            new RawSourceTarget("acme-store", "srv-01"),
        ));

        self::assertStringContainsString("?", $calls[0]["url"]);
        self::assertStringContainsString("subClient=acme-store", $calls[0]["url"]);
        self::assertStringContainsString("resource=srv-01", $calls[0]["url"]);
        // A partial failure is surfaced, not swallowed by the 202 status.
        self::assertSame(1, $result->failed);
    }

    public function testRejectsMissingOrMalformedInputs(): void
    {
        $cases = [
            "malformed parser" => fn () => new RawIngestRequest("x", "not-a-uuid"),
            "empty parser" => fn () => new RawIngestRequest("x", ""),
            "partial target" => fn () => new RawSourceTarget("acme-store", ""),
            "bad code" => fn () => new RawSourceTarget("bad code", "srv-01"),
        ];
        foreach ($cases as $name => $case) {
            try {
                $case();
                self::fail("expected {$name} to be rejected");
            } catch (\InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function testRejectsMalformedAcceptanceBodiesAsUnknownAcceptance(): void
    {
        $bodies = [
            "null" => null,
            "empty object" => [],
            "missing failed" => ["success" => true, "processed" => 2],
            "missing processed" => ["success" => true, "failed" => 0],
            "missing success" => ["processed" => 2, "failed" => 0],
            "wrong success type" => ["success" => "yes", "processed" => 2, "failed" => 0],
            "wrong processed type" => ["success" => true, "processed" => "2", "failed" => 0],
            "negative processed" => ["success" => true, "processed" => -1, "failed" => 0],
            "negative failed" => ["success" => true, "processed" => 2, "failed" => -1],
        ];
        foreach ($bodies as $name => $body) {
            $calls = [];
            $client = $this->clientWithResponse($body, $calls);
            $thrown = null;
            try {
                $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
            } catch (\Throwable $error) {
                $thrown = $error;
            }
            self::assertNotNull($thrown, "expected {$name} to be rejected");
            // Exact ambiguous classification: typed unknown acceptance, not a retry.
            self::assertNotInstanceOf(RetryableException::class, $thrown);
            self::assertInstanceOf(RawAcceptanceUnknownException::class, $thrown);
        }
    }

    public function testPreservesLegitimatePartialCounts(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["success" => true, "processed" => 3, "failed" => 1], $calls);
        $result = $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
        self::assertSame(3, $result->processed);
        self::assertSame(1, $result->failed);
    }

    public function testClassifiesARetryableStatusAsUnknownAcceptance(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["title" => "unavailable"], $calls, 503);
        $this->expectException(RawAcceptanceUnknownException::class);
        $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
    }

    public function testKeepsANonRetryableStatusADefiniteRejection(): void
    {
        $calls = [];
        $client = $this->clientWithResponse(["title" => "invalid"], $calls, 400);
        try {
            $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
            self::fail("expected a rejection");
        } catch (\RuntimeException $error) {
            self::assertNotInstanceOf(RawAcceptanceUnknownException::class, $error);
        }
    }

    public function testMapsACustomRawTransportRetryableThrowToUnknownAcceptance(): void
    {
        $invocations = 0;
        $client = new CustdClient("http://localhost:8080", "token", [
            "http_client" => function (
                string $url,
                mixed $payload,
                string $token,
                array $headers = []
            ) use (&$invocations): array {
                $invocations++;

                // The documented transport-failure signal, thrown after submit.
                throw new RetryableException("connection reset");
            },
        ]);

        $thrown = null;
        try {
            $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
        } catch (\Throwable $error) {
            $thrown = $error;
        }

        // The callback is invoked exactly once: the raw upload is never replayed.
        self::assertSame(1, $invocations);
        self::assertNotNull($thrown);
        // Exact ambiguous classification: unknown acceptance, not a retryable error.
        self::assertNotInstanceOf(RetryableException::class, $thrown);
        self::assertInstanceOf(RawAcceptanceUnknownException::class, $thrown);
        // The original transport cause is preserved on the unknown-acceptance error.
        self::assertInstanceOf(RetryableException::class, $thrown->getPrevious());
    }

    public function testIdempotencyKeyIsMintedAndRetainedAcrossAResend(): void
    {
        $key = RawRequestIdempotencyKey::generate();
        self::assertMatchesRegularExpression(
            '/^\d+:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            $key->value,
        );

        $calls = [];
        $client = $this->clientWithResponse(["success" => true, "processed" => 1, "failed" => 0], $calls);
        $request = new RawIngestRequest("line\n", self::PARSER_UUID, null, $key);
        $client->ingestRawLines($request);
        $client->ingestRawLines($request);

        self::assertSame($key->value, $calls[0]["headers"]["Idempotency-Key"]);
        self::assertSame($key->value, $calls[1]["headers"]["Idempotency-Key"]);
    }

    public function testIdempotencyKeyIsFreshPerRequestObject(): void
    {
        self::assertNotSame(
            RawRequestIdempotencyKey::generate()->value,
            RawRequestIdempotencyKey::generate()->value,
        );
    }

    public function testNoKeySendsNoIdempotencyHeader(): void
    {
        $calls = [];
        $this->clientWithResponse(["success" => true, "processed" => 1, "failed" => 0], $calls)
            ->ingestRawLines(new RawIngestRequest("line\n", self::PARSER_UUID));
        self::assertArrayNotHasKey("Idempotency-Key", $calls[0]["headers"]);
    }

    public function testConflictAndExpiryStayDefiniteRejections(): void
    {
        foreach ([409, 400] as $status) {
            $calls = [];
            $client = $this->clientWithResponse(["title" => "idempotency conflict"], $calls, $status);
            try {
                $client->ingestRawLines(new RawIngestRequest(
                    "line\n",
                    self::PARSER_UUID,
                    null,
                    RawRequestIdempotencyKey::generate(),
                ));
                self::fail("expected a rejection for status {$status}");
            } catch (\RuntimeException $error) {
                self::assertNotInstanceOf(RawAcceptanceUnknownException::class, $error);
            }
        }
    }

    public function testUnknownAcceptanceSurfacesTheOperationKey(): void
    {
        $key = RawRequestIdempotencyKey::generate();
        $client = new CustdClient("http://localhost:8080", "token", [
            "http_client" => function (string $url, mixed $payload, string $token, array $headers = []): array {
                throw new RetryableException("connection reset");
            },
        ]);
        try {
            $client->ingestRawLines(new RawIngestRequest("line\n", self::PARSER_UUID, null, $key));
            self::fail("expected unknown acceptance");
        } catch (RawAcceptanceUnknownException $error) {
            self::assertSame($key->value, $error->operationKey);
        }
    }

    /**
     * clientWithResponse builds a client whose custom transport records each call
     * including the fourth headers argument.
     *
     * @param array<int, array<string, mixed>> $calls
     */
    private function clientWithResponse(mixed $response, array &$calls, int $status = 202): CustdClient
    {
        return new CustdClient("http://localhost:8080", "token", [
            "http_client" => function (
                string $url,
                mixed $payload,
                string $token,
                array $headers = []
            ) use (&$calls, $response, $status): array {
                $calls[] = compact("url", "payload", "token", "headers");

                return [
                    "status" => $status,
                    "body" => json_encode($response, JSON_THROW_ON_ERROR),
                ];
            },
        ]);
    }
}
