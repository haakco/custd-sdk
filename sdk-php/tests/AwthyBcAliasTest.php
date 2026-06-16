<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\Awthy\AwthyAuditRedactionRequest;
use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * The v1.2.1 rename moved `HaakCo\Custd\Authy\*` to `HaakCo\Custd\Awthy\*` and
 * `redactAuthyAuditEvents()` to `redactAwthyAuditEvents()` in a *patch* release,
 * which broke downstream builds. These BC shims keep the old names working for
 * one deprecation cycle so the rename behaves like a non-breaking change.
 */
final class AwthyBcAliasTest extends TestCase
{
    public function testOldAuditEventClassNameResolvesToNewClass(): void
    {
        $legacy = "HaakCo\\Custd\\Authy\\AuthyAuditEvent";

        $this->assertTrue(class_exists($legacy));
        $this->assertSame(
            \HaakCo\Custd\Awthy\AwthyAuditEvent::class,
            (new \ReflectionClass($legacy))->getName(),
            "The legacy Authy class must alias the renamed Awthy class.",
        );
    }

    public function testOldRedactionRequestClassNameResolvesToNewClass(): void
    {
        $legacy = "HaakCo\\Custd\\Authy\\AuthyAuditRedactionRequest";

        $this->assertTrue(class_exists($legacy));
        $this->assertSame(
            AwthyAuditRedactionRequest::class,
            (new \ReflectionClass($legacy))->getName(),
        );
    }

    public function testDeprecatedRedactMethodDelegatesToRenamedMethod(): void
    {
        $captured = [];
        $client = new CustdClient("https://custd.example.com", "token", [
            "http_client" => function (string $url) use (&$captured): array {
                $captured[] = $url;
                return ["status" => 200, "body" => '{"redacted":1}'];
            },
        ]);

        $request = AwthyAuditRedactionRequest::fromArray("store-1", [
            "redactionId" => "red-1",
            "reason" => "gdpr-erasure",
            "events" => [
                ["localAuditEventId" => "1", "fields" => ["actor"]],
            ],
        ]);

        $result = $client->redactAuthyAuditEvents($request);

        $this->assertSame(["redacted" => 1], $result);
        $this->assertStringContainsString("/api/v1/managed-audit/redactions", $captured[0]);
    }
}
