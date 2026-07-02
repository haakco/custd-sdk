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

        $this->assertSame("awthy-audit-event", $event["eventTypeSlug"]);
        $this->assertSame("1.1.0", $event["schemaVersion"]);
        $this->assertSame("tenant-acme", $event["companySlug"]);
        $this->assertSame("server", $event["context"]["device"]["type"]);
        $this->assertSame("awthy", $event["payload"]["sourceSystem"]);
        $this->assertSame("1.1.0", $event["payload"]["schemaVersion"]);
        $this->assertSame("store-123", $event["payload"]["storeId"]);
        $this->assertSame("evt-local-1", $event["payload"]["localAuditEventId"]);
        $this->assertSame("01957abc-0000-0000-0000-000000000001", $event["payload"]["localAuditEventUuid"]);
    }

    public function testAwthyAuditEventMatchesSharedFixture(): void
    {
        $event = AwthyAuditEvent::fromArray("tenant-acme", "store-123", $this->basePayload())->toArray();
        $fixture = $this->readFixture("valid-awthy-audit-event.json");

        $this->assertSame($fixture, $event);
    }

    public function testAwthyAuditEventBuildsWooCommerceFlowFixture(): void
    {
        $event = AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $this->woocommercePayload())->toArray();
        $fixture = $this->readFixture("valid-awthy-woocommerce-flow-event.json");

        $this->assertSame($fixture, $event);
    }

    public function testAwthyAuditEventRejectsNestedWooCommerceSecrets(): void
    {
        foreach ([
            ["woocommerce", "paymentToken"],
            ["woocommerce", "paymentGateway"],
            ["woocommerce", "orderNumber"],
            ["actor", "customerEmail"],
            ["target", "billingEmail"],
        ] as [$section, $secretKey]) {
            $payload = $this->woocommercePayload();
            $payload[$section][$secretKey] = "secret";

            try {
                AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $payload);
                $this->fail("expected secret-bearing key {$secretKey} to be rejected");
            } catch (\InvalidArgumentException $err) {
                $this->assertStringContainsString($secretKey, $err->getMessage());
            }
        }
    }

    public function testAwthyAuditEventRejectsListArrayReportingSections(): void
    {
        foreach (["flow", "woocommerce"] as $section) {
            $payload = $this->woocommercePayload();
            $payload[$section] = ["not-an-object"];

            try {
                AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $payload);
                $this->fail("expected list-array {$section} section to be rejected");
            } catch (\InvalidArgumentException $err) {
                $this->assertStringContainsString($section, $err->getMessage());
            }
        }
    }

    public function testAwthyAuditEventRejectsListArrayReportingSectionsThroughCanonicalFactory(): void
    {
        $payload = $this->woocommercePayload();
        $payload["flow"] = ["not-an-object"];

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("flow");

        AwthyAuditEvent::fromArray("tenant-acme", "store-123", $payload);
    }

    public function testAwthyAuditEventRejectsUnexpectedReportingFieldsThroughCanonicalFactory(): void
    {
        $payload = $this->woocommercePayload();
        $payload["woocommerce"]["orderId"] = "123";

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("woocommerce.orderId");

        AwthyAuditEvent::fromArray("tenant-acme", "store-123", $payload);
    }

    public function testAwthyManagedReportingPayloadRejectsUnexpectedReportingFields(): void
    {
        foreach ([
            ["billingAddress", "secret"],
            ["woocommerce", ["orderId" => "123"]],
            ["actor", ["displayName" => "Customer"]],
            ["target", ["displayName" => "Order 1001"]],
            ["sanitizedContext", ["customerName" => "Jane"]],
        ] as [$field, $value]) {
            $payload = $this->woocommercePayload();
            $payload[$field] = $value;

            try {
                AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $payload);
                $this->fail("expected unexpected reporting field {$field} to be rejected");
            } catch (\InvalidArgumentException $err) {
                $this->assertStringContainsString((string) $field, $err->getMessage());
            }
        }
    }

    public function testAwthyManagedReportingPayloadRejectsInvalidHashes(): void
    {
        $payload = $this->woocommercePayload();
        $payload["target"]["referenceHash"] = "abc123";

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("target.referenceHash");

        AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $payload);
    }

    public function testAwthyManagedReportingPayloadRequiresTargetReferenceHash(): void
    {
        $payload = $this->woocommercePayload();
        unset($payload["target"]["referenceHash"]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("target.referenceHash");

        AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $payload);
    }

    public function testAwthyManagedReportingPayloadRejectsUnknownFlowFamilies(): void
    {
        $payload = $this->woocommercePayload();
        $payload["flow"]["family"] = "woocommerce_checkout";

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("flow.family");

        AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $payload);
    }

    public function testAwthyManagedReportingPayloadPreservesLocalAuditIdentifiers(): void
    {
        $event = AwthyAuditEvent::managedReportingPayload("tenant-acme", "store-123", $this->woocommercePayload())->toArray();

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

    public function testAwthyAuditEventRejectsNormalizedSecretBearingPayloadKeys(): void
    {
        foreach ([
            "oauthToken",
            "totpSecret",
            "client_secret",
            "authorization",
            "api_key",
            "password",
            "rawIp",
        ] as $secretKey) {
            $payload = $this->basePayload();
            $payload["sanitizedContext"] = [$secretKey => "secret"];

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
            "storeHostnameHash" => "sha256:1111111111111111111111111111111111111111111111111111111111111111",
            "localAuditEventId" => "evt-local-1",
            "localAuditEventUuid" => "01957abc-0000-0000-0000-000000000001",
            "eventType" => "totp_enabled",
            "actor" => ["type" => "admin", "wordpressUserIdHash" => "sha256:2222222222222222222222222222222222222222222222222222222222222222", "anonymized" => true],
            "action" => "totp_enabled",
            "target" => ["type" => "wordpress_user", "referenceHash" => "sha256:2222222222222222222222222222222222222222222222222222222222222222", "anonymized" => true],
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

    /**
     * @return array<string, mixed>
     */
    private function woocommercePayload(): array
    {
        $payload = $this->basePayload();
        $payload["eventType"] = "woocommerce_checkout_payment_failed";
        $payload["actor"] = ["type" => "customer", "wordpressUserIdHash" => "sha256:2222222222222222222222222222222222222222222222222222222222222222", "anonymized" => true];
        $payload["action"] = "woocommerce_checkout_payment_failed";
        $payload["target"] = ["type" => "woocommerce_order", "referenceHash" => "sha256:3333333333333333333333333333333333333333333333333333333333333333", "anonymized" => true];
        $payload["outcome"] = "failure";
        $payload["source"] = "woocommerce_checkout";
        $payload["reasonCategory"] = "checkout";
        $payload["stream"] = "woocommerce_checkout";
        $payload["severity"] = "warning";
        $payload["occurredAt"] = "2026-07-01T12:00:00Z";
        $payload["flow"] = [
            "family" => "secure_checkout",
            "step" => "checkout_payment_failed",
            "correlationHash" => "sha256:4444444444444444444444444444444444444444444444444444444444444444",
            "sequence" => 30,
        ];
        $payload["woocommerce"] = [
            "checkoutFlow" => "classic",
            "orderStatus" => "failed",
            "paymentGatewayHash" => "sha256:5555555555555555555555555555555555555555555555555555555555555555",
            "cartHash" => "sha256:6666666666666666666666666666666666666666666666666666666666666666",
        ];
        $payload["correlations"] = [
            ["type" => "woocommerce_order", "referenceHash" => "sha256:3333333333333333333333333333333333333333333333333333333333333333"],
        ];

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function readFixture(string $name): array
    {
        $json = file_get_contents(__DIR__ . "/../../contract-fixtures/" . $name);
        if ($json === false) {
            throw new \RuntimeException("missing fixture {$name}");
        }

        $decoded = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new \RuntimeException("fixture {$name} did not decode to an array");
        }

        return $decoded;
    }
}
