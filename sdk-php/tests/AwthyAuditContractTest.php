<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Awthy\AwthyAuditEvent;
use HaakCo\Custd\Awthy\AwthyAuditRedactionRequest;
use HaakCo\Custd\CustdClient;
use HaakCo\Custd\RetryableException;
use PHPUnit\Framework\TestCase;

final class AwthyAuditContractTest extends TestCase
{
    public function testAwthyAuditEventBuildsCanonicalCustdEnvelope(): void
    {
        $event = AwthyAuditEvent::fromArray("tenant-acme", "store-123", $this->basePayload())->toArray();

        $this->assertSame("awthy.audit_event", $event["eventTypeSlug"]);
        $this->assertSame("1.0.0", $event["schemaVersion"]);
        $this->assertSame("tenant-acme", $event["companySlug"]);
        $this->assertSame("server", $event["context"]["device"]["type"]);
        $this->assertSame("awthy", $event["payload"]["sourceSystem"]);
        $this->assertSame("store-123", $event["payload"]["storeId"]);
        $this->assertSame("evt-local-1", $event["payload"]["localAuditEventId"]);
        $this->assertSame("01957abc-0000-0000-0000-000000000001", $event["payload"]["localAuditEventUuid"]);
    }

    public function testAwthyAuditEventRejectsSecretBearingPayloadKeys(): void
    {
        foreach ([
            "email",
            "raw_ip",
            "user_agent",
            "token",
            "recovery_code",
            "totp_secret",
            "passkey_credential_id",
            "oauth_token",
            "payment_card",
            "payment_token",
        ] as $secretKey) {
            $payload = $this->basePayload();
            $payload[$secretKey] = "secret";

            try {
                AwthyAuditEvent::fromArray("tenant-acme", "store-123", $payload);
                $this->fail("expected secret-bearing key {$secretKey} to be rejected");
            } catch (\InvalidArgumentException $err) {
                $this->assertStringContainsString($secretKey, $err->getMessage());
            }
        }
    }

    public function testAwthyAuditEventDoesNotCopyTenantOrStoreFromEventControlledData(): void
    {
        $payload = $this->basePayload();
        $payload["storeId"] = "attacker-store";
        $payload["sanitizedContext"] = [
            "companySlug" => "attacker-tenant",
            "storeId" => "attacker-store",
        ];
        $payload["targets"] = [
            ["companySlug" => "attacker-tenant"],
        ];
        $payload["correlations"] = [
            ["storeId" => "attacker-store"],
        ];

        $event = AwthyAuditEvent::fromArray("tenant-acme", "store-123", $payload)->toArray();

        $this->assertSame("tenant-acme", $event["companySlug"]);
        $this->assertSame("store-123", $event["payload"]["storeId"]);
        $this->assertSame("attacker-tenant", $event["payload"]["sanitizedContext"]["companySlug"]);
        $this->assertSame("attacker-store", $event["payload"]["correlations"][0]["storeId"]);
    }

    public function testAwthyAuditRedactionRequestBuildsCanonicalShape(): void
    {
        $request = AwthyAuditRedactionRequest::fromArray("store-123", [
            "redactionId" => "01957abc-0000-0000-0000-000000000099",
            "reason" => "privacy_erasure",
            "events" => [
                [
                    "localAuditEventId" => "evt-local-1",
                    "localAuditEventUuid" => "01957abc-0000-0000-0000-000000000001",
                    "fields" => ["actor", "target", "sanitizedContext"],
                ],
            ],
        ])->toArray();

        $this->assertSame("awthy", $request["sourceSystem"]);
        $this->assertSame("store-123", $request["storeId"]);
        $this->assertSame("01957abc-0000-0000-0000-000000000099", $request["redactionId"]);
        $this->assertSame("privacy_erasure", $request["reason"]);
        $this->assertSame("evt-local-1", $request["events"][0]["localAuditEventId"]);
        $this->assertSame(["actor", "target", "sanitizedContext"], $request["events"][0]["fields"]);
    }

    public function testClientPostsAwthyRedactionThroughManagedAuditEndpoint(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "token", [
            "http_client" => function (string $url, array $payload, string $token) use (&$calls): array {
                $calls[] = compact("url", "payload", "token");

                return [
                    "status" => 202,
                    "body" => '{"success":true,"redactionId":"01957abc-0000-0000-0000-000000000099","results":[{"localAuditEventId":"evt-local-1","status":"redacted"}]}',
                ];
            },
        ]);
        $request = AwthyAuditRedactionRequest::fromArray("store-123", [
            "redactionId" => "01957abc-0000-0000-0000-000000000099",
            "reason" => "privacy_erasure",
            "events" => [
                [
                    "localAuditEventId" => "evt-local-1",
                    "fields" => ["actor"],
                ],
            ],
        ]);

        $response = $client->redactAwthyAuditEvents($request);

        $this->assertSame("http://localhost:8080/api/v1/managed-audit/redactions", $calls[0]["url"]);
        $this->assertSame("token", $calls[0]["token"]);
        $this->assertSame($request->toArray(), $calls[0]["payload"]);
        $this->assertTrue($response["success"]);
        $this->assertSame("redacted", $response["results"][0]["status"]);
    }

    public function testClientRetriesAwthyRedactionOnRetryableFailures(): void
    {
        $calls = 0;
        $client = new CustdClient("http://localhost:8080", "token", [
            "retry" => ["max_attempts" => 2, "base_delay_ms" => 0, "max_delay_ms" => 0, "jitter" => 0],
            "http_client" => function () use (&$calls): array {
                $calls++;
                if ($calls === 1) {
                    throw new RetryableException("offline");
                }

                return ["status" => 202, "body" => '{"success":true,"results":[]}'];
            },
        ]);

        $client->redactAwthyAuditEvents(AwthyAuditRedactionRequest::fromArray("store-123", [
            "redactionId" => "01957abc-0000-0000-0000-000000000099",
            "reason" => "privacy_erasure",
            "events" => [["localAuditEventId" => "evt-local-1", "fields" => ["actor"]]],
        ]));

        $this->assertSame(2, $calls);
    }

    /**
     * @return array<string, mixed>
     */
    private function basePayload(): array
    {
        return [
            "storeHostnameHash" => "sha256:example",
            "localAuditEventId" => "evt-local-1",
            "localAuditEventUuid" => "01957abc-0000-0000-0000-000000000001",
            "eventType" => "totp_enabled",
            "actor" => ["type" => "admin", "wordpressUserId" => 42, "anonymized" => false],
            "action" => "totp_enabled",
            "target" => ["type" => "wordpress_user", "display" => "User #42", "anonymized" => false],
            "outcome" => "success",
            "source" => "wpauth",
            "reasonCategory" => "account_security",
            "stream" => "interactive",
            "severity" => "info",
            "correlationId" => "export-job-1",
            "occurredAt" => "2026-06-10T00:00:00Z",
            "sanitizedContext" => [],
            "targets" => [],
            "correlations" => [],
        ];
    }
}
