<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\FileQueueStore;
use HaakCo\Custd\MemoryQueueStore;
use HaakCo\Custd\RetryableException;
use PHPUnit\Framework\TestCase;

final class CustdClientTest extends TestCase
{
    /** @var array<string, mixed> */
    private array $baseEvent = [
        "eventUuid" => "evt-1",
        "eventTypeSlug" => "page-view",
        "schemaVersion" => "1.0.0",
        "timestamp" => "2026-01-24T00:00:00Z",
        "sessionId" => "sess-1",
        "anonymousId" => "anon-1",
        "companySlug" => "test-company",
        "context" => [
            "device" => ["type" => "desktop"],
        ],
        "payload" => ["foo" => "bar"],
    ];

    public function testValidateEventMissingDeviceType(): void
    {
        $event = $this->baseEvent;
        $event["context"]["device"] = [];

        $this->expectException(\InvalidArgumentException::class);
        CustdClient::validateEvent($event);
    }

    public function testValidateEventAcceptsCanonicalValidFixture(): void
    {
        $event = $this->loadFixture("valid-event.json");

        CustdClient::validateEvent($event);

        $this->addToAssertionCount(1);
    }

    public function testValidateEventRejectsCanonicalMissingDeviceTypeFixture(): void
    {
        $event = $this->loadFixture("invalid-missing-device-type.json");

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("context.device.type");

        CustdClient::validateEvent($event);
    }

    public function testValidateEventRejectsCanonicalMissingCompanySlugFixture(): void
    {
        $event = $this->loadFixture("invalid-missing-company-slug.json");

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("companySlug");

        CustdClient::validateEvent($event);
    }

    public function testValidateEventAcceptsCanonicalDogfoodFixture(): void
    {
        $event = $this->loadFixture("valid-dogfood-event.json");

        CustdClient::validateEvent($event);

        $this->addToAssertionCount(1);
    }

    public function testCreateDogfoodEventBuildsCanonicalShape(): void
    {
        $event = CustdClient::createDogfoodEvent([
            "eventTypeSlug" => "dogfood.producer.metric",
            "schemaVersion" => "1.0.0",
            "companySlug" => "haakco",
            "sourceSystem" => "vorrent",
            "sourceCompany" => "haakco",
            "environment" => "production",
            "correlationId" => "run-123",
            "payload" => [
                "metric" => "media_cache.queue_depth",
                "value" => 7,
                "token" => "secret",
                "sourceSystem" => "wrong",
            ],
        ]);

        $this->assertSame("haakco", $event["companySlug"]);
        $this->assertSame("server", $event["context"]["device"]["type"]);
        $this->assertSame("vorrent", $event["payload"]["sourceSystem"]);
        $this->assertSame("haakco", $event["payload"]["sourceCompany"]);
        $this->assertSame("production", $event["payload"]["environment"]);
        $this->assertSame("run-123", $event["payload"]["correlationId"]);
        $this->assertSame("media_cache.queue_depth", $event["payload"]["metric"]);
        $this->assertArrayNotHasKey("token", $event["payload"]);
    }

    public function testCreateDogfoodEventThrowsOnDroppedPayloadKeysInStrictMode(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("nested.environment, token");

        CustdClient::createDogfoodEvent([
            "eventTypeSlug" => "dogfood.producer.metric",
            "schemaVersion" => "1.0.0",
            "companySlug" => "haakco",
            "sourceSystem" => "vorrent",
            "sourceCompany" => "haakco",
            "environment" => "production",
            "strictPayloadKeys" => true,
            "payload" => [
                "metric" => "queue_depth",
                "nested" => ["environment" => "wrong"],
                "token" => "secret",
            ],
        ]);
    }

    public function testRetriesOnRetryableFailures(): void
    {
        $calls = 0;
        $client = new CustdClient("http://localhost:8080", "token", [
            "retry" => ["max_attempts" => 2, "base_delay_ms" => 0, "max_delay_ms" => 0, "jitter" => 0],
            "http_client" => function (string $url, array $event, string $token) use (&$calls): array {
                $calls++;
                if ($calls === 1) {
                    throw new RetryableException("retry");
                }
                return ["status" => 202, "body" => ""];
            },
        ]);

        $client->ingestEvent($this->baseEvent);

        $this->assertSame(2, $calls);
    }

    public function testGeneratesMissingEnvelopeIdentitiesBeforeSending(): void
    {
        $sent = null;
        $client = new CustdClient("http://localhost:8080", "token", [
            "retry" => ["max_attempts" => 1],
            "http_client" => function (string $url, array $event, string $token) use (&$sent): array {
                $this->assertSame("http://localhost:8080/api/v1/events", $url);
                $sent = $event;
                return ["status" => 202, "body" => ""];
            },
        ]);

        $event = $this->baseEvent;
        unset($event["eventUuid"], $event["sessionId"], $event["anonymousId"]);

        $client->ingestEvent($event);

        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $sent["eventUuid"]);
        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $sent["sessionId"]);
        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $sent["anonymousId"]);
    }

    public function testFlushRequeuesAndReportsFailedSend(): void
    {
        $store = new MemoryQueueStore();
        $client = new CustdClient("http://localhost:8080", "token", [
            "batch" => ["max_batch_size" => 10],
            "queue" => ["enabled" => true, "store" => $store],
            "retry" => ["max_attempts" => 1],
            "http_client" => function (): array {
                throw new RetryableException("offline");
            },
        ]);

        $client->track($this->baseEvent);

        try {
            $client->flush();
            $this->fail("expected flush to report failed send");
        } catch (RetryableException) {
            $queued = $store->load();
            $this->assertCount(1, $queued);
            $this->assertSame($this->baseEvent["eventUuid"], $queued[0]["eventUuid"]);
        }
    }

    public function testFileQueueStoreWritesPrivateJson(): void
    {
        $path = sys_get_temp_dir() . "/custd-queue-" . bin2hex(random_bytes(4)) . ".json";
        $store = new FileQueueStore($path);

        $store->save([$this->baseEvent]);

        $this->assertFileExists($path);
        $this->assertSame("0600", substr(sprintf("%o", fileperms($path)), -4));
        $this->assertSame([$this->baseEvent], $store->load());

        $store->clear();
    }

    public function testFlushThrowsAndRetainsEventsOn5xx(): void
    {
        // Regression test for #C-TEST-PHP-1: ensure flush() on a 5xx response
        // (1) propagates the exception to the caller and (2) leaves the
        // queued events in the FileQueueStore so a subsequent retry can
        // replay them. Uses FileQueueStore (not memory) to verify the events
        // are persisted to disk, not silently swallowed.

        $queuePath = sys_get_temp_dir() . "/custd-queue-" . bin2hex(random_bytes(4)) . ".json";
        $store = new FileQueueStore($queuePath);

        try {
            $statuses = [503, 503];
            $client = new CustdClient("http://localhost:8080", "token", [
                "batch" => ["max_batch_size" => 10],
                "queue" => ["enabled" => true, "store" => $store],
                "retry" => [
                    "max_attempts" => 1,
                    "base_delay_ms" => 0,
                    "max_delay_ms" => 0,
                    "jitter" => 0,
                    "retry_statuses" => [408, 429, 500, 502, 503, 504],
                ],
                // Simulate the curl path's behaviour: a 5xx status from the
                // transport must surface as a RetryableException so that
                // sendWithRetry() and flush() handle it correctly. A custom
                // http_client that swallows the 5xx (e.g. returns a normal
                // array) would mask data loss; this test pins down the
                // contract that flush() throws on transport failure.
                "http_client" => function (string $url, array $event, string $token) use (&$statuses): array {
                    $status = array_shift($statuses) ?? 503;
                    if (in_array($status, [408, 429, 500, 502, 503, 504], true)) {
                        throw new RetryableException("custd: retryable status {$status}");
                    }
                    return ["status" => $status, "body" => ""];
                },
            ]);

            $eventA = $this->baseEvent;
            $eventA["eventUuid"] = "evt-5xx-a";
            $eventB = $this->baseEvent;
            $eventB["eventUuid"] = "evt-5xx-b";

            $client->track($eventA);
            $client->track($eventB);

            // Both events should now be queued on disk. Track() does not
            // flush in batch mode until max_batch_size is reached, so disk
            // already holds two events at this point.
            $this->assertCount(2, $store->load(), "events should be queued before flush");

            $threw = false;
            try {
                $client->flush();
            } catch (RetryableException) {
                $threw = true;
            }

            $this->assertTrue($threw, "flush() must throw on 5xx, not swallow the failure");

            // After the failed flush, the events must STILL be on disk so a
            // retry can replay them. The queue must not be silently cleared.
            $persisted = $store->load();
            $this->assertCount(2, $persisted, "events must be retained on disk after a 5xx flush");
            $this->assertSame("evt-5xx-a", $persisted[0]["eventUuid"]);
            $this->assertSame("evt-5xx-b", $persisted[1]["eventUuid"]);
        } finally {
            if (file_exists($queuePath)) {
                unlink($queuePath);
            }
        }
    }

    public function testHttpClientReturning5xxIsTranslatedToRetryableException(): void
    {
        // Regression: when a user-supplied http_client callable RETURNS a 5xx
        // response (rather than throwing), the SDK must apply the same status
        // translation as the curl path: 5xx in retry_statuses -> RetryableException.
        // Otherwise sendWithRetry() never retries and flush() never reports failure.

        $calls = 0;
        $client = new CustdClient("http://localhost:8080", "token", [
            "retry" => [
                "max_attempts" => 3,
                "base_delay_ms" => 0,
                "max_delay_ms" => 0,
                "jitter" => 0,
                "retry_statuses" => [408, 429, 500, 502, 503, 504],
            ],
            "http_client" => function (string $url, array $event, string $token) use (&$calls): array {
                $calls++;
                return ["status" => 503, "body" => "service unavailable"];
            },
        ]);

        try {
            $client->ingestEvent($this->baseEvent);
            $this->fail("expected RetryableException after exhausting retries on 503");
        } catch (RetryableException $err) {
            $this->assertSame(3, $calls, "should retry up to max_attempts on 5xx");
            $this->assertStringContainsString("503", $err->getMessage());
        }
    }

    public function testHttpClientReturning4xxIsTranslatedToRuntimeException(): void
    {
        // Regression: a 4xx response from a user-supplied http_client must
        // surface as a non-retryable RuntimeException, matching the curl path.

        $calls = 0;
        $client = new CustdClient("http://localhost:8080", "token", [
            "retry" => [
                "max_attempts" => 3,
                "base_delay_ms" => 0,
                "max_delay_ms" => 0,
                "jitter" => 0,
            ],
            "http_client" => function (string $url, array $event, string $token) use (&$calls): array {
                $calls++;
                return ["status" => 400, "body" => "bad request"];
            },
        ]);

        try {
            $client->ingestEvent($this->baseEvent);
            $this->fail("expected RuntimeException on 4xx response from http_client");
        } catch (RetryableException $err) {
            $this->fail("4xx must not be retried, got RetryableException: " . $err->getMessage());
        } catch (\RuntimeException $err) {
            $this->assertSame(1, $calls, "4xx must not be retried");
            $this->assertStringContainsString("400", $err->getMessage());
        }
    }

    public function testCustomRetryStatusesReplacesDefaults(): void
    {
        // Regression for Sec-2: array_merge() in the constructor performs a
        // SHALLOW merge, so passing retry => ["retry_statuses" => [503]]
        // replaces the default 5xx list wholesale. This pins that contract:
        // a 500 response with retry_statuses=[503] must surface as a
        // non-retryable RuntimeException and MUST NOT be retried.
        // Documented in CustdClient::__construct PHPDoc.

        $calls = 0;
        $client = new CustdClient("http://localhost:8080", "token", [
            "retry" => [
                "max_attempts" => 3,
                "base_delay_ms" => 0,
                "max_delay_ms" => 0,
                "jitter" => 0,
                "retry_statuses" => [503],
            ],
            "http_client" => function (string $url, array $event, string $token) use (&$calls): array {
                $calls++;
                return ["status" => 500, "body" => ""];
            },
        ]);

        try {
            $client->ingestEvent($this->baseEvent);
            $this->fail("expected RuntimeException on 500 when retry_statuses=[503]");
        } catch (RetryableException $err) {
            $this->fail(
                "500 must not be retried when retry_statuses=[503] (shallow replace contract): "
                . $err->getMessage()
            );
        } catch (\RuntimeException $err) {
            $this->assertSame(
                1,
                $calls,
                "500 should not be retried when retry_statuses is replaced with [503]"
            );
            $this->assertStringContainsString("500", $err->getMessage());
        }
    }

    public function testDefaultRetryStatusesIncludes500_502_504(): void
    {
        // Regression for Sec-2: when no retry override is supplied, the
        // default retry_statuses list MUST include the full 5xx range
        // [408, 429, 500, 502, 503, 504]. This pins the default contract so
        // a future refactor cannot silently shrink the default set.

        foreach ([502, 504] as $status) {
            $calls = 0;
            $client = new CustdClient("http://localhost:8080", "token", [
                // No retry override: rely entirely on defaults.
                // base_delay_ms is overridden only to keep the test fast;
                // retry_statuses is intentionally NOT supplied.
                "retry" => ["max_attempts" => 3, "base_delay_ms" => 0, "max_delay_ms" => 0, "jitter" => 0],
                "http_client" => function (string $url, array $event, string $token) use (&$calls, $status): array {
                    $calls++;
                    return ["status" => $status, "body" => ""];
                },
            ]);

            try {
                $client->ingestEvent($this->baseEvent);
                $this->fail("expected RetryableException on default-retryable status {$status}");
            } catch (RetryableException $err) {
                $this->assertSame(
                    3,
                    $calls,
                    "status {$status} must be retried up to max_attempts using default retry_statuses"
                );
                $this->assertStringContainsString((string) $status, $err->getMessage());
            }
        }
    }

    public function testBatchRejectionNamesFailedEvents(): void
    {
        $client = new CustdClient("http://localhost:8080", "token", [
            "batch" => ["max_batch_size" => 10],
            "queue" => ["enabled" => true],
            "retry" => ["max_attempts" => 1],
            "http_client" => function (): array {
                return [
                    "status" => 202,
                    "body" => '{"success":false,"results":[' .
                        '{"eventUuid":"evt-ok","success":true,"status":202},' .
                        '{"eventUuid":"evt-bad","success":false,"status":400,"error":"validation failed"}' .
                        ']}',
                ];
            },
        ]);

        $eventBad = $this->baseEvent;
        $eventBad["eventUuid"] = "evt-bad";
        $client->track($eventBad);

        try {
            $client->flush();
            $this->fail("expected RuntimeException on partial batch failure");
        } catch (\RuntimeException $e) {
            self::assertStringContainsString("evt-bad", $e->getMessage());
            self::assertStringContainsString("400", $e->getMessage());
            self::assertStringContainsString("validation failed", $e->getMessage());
            self::assertStringContainsString("1 of 2", $e->getMessage());
            self::assertStringNotContainsString("evt-ok", $e->getMessage());
        }
    }

    public function testBatchFlushesOnMaxBatchSize(): void
    {
        $calls = 0;
        $seenUrl = null;
        $seenPayload = null;
        $client = new CustdClient("http://localhost:8080", "token", [
            "batch" => ["max_batch_size" => 2],
            "queue" => ["enabled" => true],
            "retry" => ["max_attempts" => 1],
            "http_client" => function (string $url, array $payload, string $token) use (
                &$calls,
                &$seenUrl,
                &$seenPayload
            ): array {
                $calls++;
                $seenUrl = $url;
                $seenPayload = $payload;
                return ["status" => 202, "body" => '{"success":true}'];
            },
        ]);

        $eventA = $this->baseEvent;
        $eventA["eventUuid"] = "evt-1";
        $eventB = $this->baseEvent;
        $eventB["eventUuid"] = "evt-2";

        $client->track($eventA);
        $client->track($eventB);

        $this->assertSame(1, $calls);
        $this->assertSame("http://localhost:8080/api/v1/events/batch", $seenUrl);
        $this->assertCount(2, $seenPayload["events"]);
        $this->assertSame("evt-1", $seenPayload["events"][0]["eventUuid"]);
        $this->assertSame("evt-2", $seenPayload["events"][1]["eventUuid"]);
    }

    public function testUsesOauthProducerCredentialsForBearerAuth(): void
    {
        $tokenRequests = [];
        $seenToken = null;
        $client = new CustdClient("http://localhost:8080", null, [
            "oauth" => [
                "client_id" => "producer",
                "client_secret" => "secret",
                "token_url" => "http://localhost:4444/oauth2/token",
                "audience" => "custd",
                "scopes" => ["events.write"],
                "transport" => function (string $url, array $form) use (&$tokenRequests): array {
                    $tokenRequests[] = ["url" => $url, "form" => $form];
                    return ["access_token" => "oauth-token", "expires_in" => 300];
                },
            ],
            "retry" => ["max_attempts" => 1],
            "http_client" => function (string $url, array $event, string $token) use (&$seenToken): array {
                $seenToken = $token;
                return ["status" => 202, "body" => ""];
            },
        ]);

        $client->ingestEvent($this->baseEvent);

        $this->assertSame("http://localhost:4444/oauth2/token", $tokenRequests[0]["url"]);
        $this->assertSame("client_credentials", $tokenRequests[0]["form"]["grant_type"]);
        $this->assertSame("oauth-token", $seenToken);
    }

    public function testRejectsPlaintextNonLocalBaseUrl(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("baseUrl must use https");

        new CustdClient("http://custd.example.com", "token");
    }

    public function testRejectsPlaintextNonLocalTokenUrl(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("tokenUrl must use https");

        new CustdClient("https://custd.example.com", null, [
            "oauth" => [
                "client_id" => "producer",
                "client_secret" => "secret",
                "token_url" => "http://auth.example.com/oauth2/token",
            ],
        ]);
    }

    public function testAllowsPlaintextLocalhostUrls(): void
    {
        new CustdClient("http://localhost:8080", null, [
            "oauth" => [
                "client_id" => "producer",
                "client_secret" => "secret",
                "token_url" => "http://127.0.0.1:4444/oauth2/token",
                "transport" => fn (): array => ["access_token" => "token", "expires_in" => 300],
            ],
        ]);

        $this->addToAssertionCount(1);
    }

    public function testFromProvisionedProducerCreatesClientWithoutManualMapping(): void
    {
        $credentials = $this->loadFixture("valid-provisioned-producer.json");

        $client = CustdClient::fromProvisionedProducer($credentials);

        $this->assertInstanceOf(CustdClient::class, $client);
    }

    public function testFromProvisionedProducerRejectsMissingClientSecret(): void
    {
        $credentials = $this->loadFixture("invalid-provisioned-producer-missing-secret.json");

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches("/client secret/");

        CustdClient::fromProvisionedProducer($credentials);
    }

    public function testRedactedProvisionedProducerOmitsSecret(): void
    {
        $credentials = $this->loadFixture("valid-provisioned-producer.json");

        $redacted = CustdClient::redactedProvisionedProducer($credentials);

        $this->assertSame($credentials["clientId"], $redacted["clientId"]);
        $this->assertArrayNotHasKey("clientSecret", $redacted);
        $encoded = json_encode($redacted, JSON_THROW_ON_ERROR);
        $this->assertStringNotContainsString((string) $credentials["clientSecret"], $encoded);
    }

    /**
     * @return array<string, mixed>
     */
    private function loadFixture(string $name): array
    {
        $path = __DIR__ . "/../../contract-fixtures/" . $name;
        $raw = file_get_contents($path);
        if ($raw === false) {
            $this->fail("failed to read fixture {$name}");
        }
        $decoded = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            $this->fail("fixture {$name} did not decode to an array");
        }
        return $decoded;
    }
}
