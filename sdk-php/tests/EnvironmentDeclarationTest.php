<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

/**
 * One credential serves every environment, so declaring one is an event or
 * process option rather than a provisioning step.
 */
final class EnvironmentDeclarationTest extends TestCase
{
    /** @return array{0:CustdClient,1:callable():array<int,array<string,mixed>>} */
    private function client(string $environment = ""): array
    {
        $sent = [];
        $options = [
            "http_client" => function (string $url, array $payload, string $token) use (&$sent): array {
                $sent[] = $payload;
                return ["status" => 202, "body" => '{"success":true}'];
            },
        ];
        if ($environment !== "") {
            $options["environment"] = $environment;
        }
        $client = new CustdClient("http://localhost:8080", "token", $options);
        return [$client, function () use (&$sent): array {
            return $sent;
        }];
    }

    /** @return array<string,mixed> */
    private function event(): array
    {
        return [
            "eventTypeSlug" => "page-view",
            "schemaVersion" => "1.0.0",
            "timestamp" => "2026-09-12T10:00:00Z",
            "companySlug" => "acme",
            "context" => ["device" => ["type" => "desktop"]],
            "payload" => [],
        ];
    }

    public function testClientEnvironmentAppliesAsReservedLabel(): void
    {
        [$client, $sent] = $this->client("development");
        $client->ingestEvent($this->event());

        $this->assertSame(["custd.environment" => "development"], $sent()[0]["labels"]);
    }

    public function testEventEnvironmentOverridesTheClientDefault(): void
    {
        [$client, $sent] = $this->client("development");
        $event = $this->event();
        $event["environment"] = "preview-pr-9";
        $client->ingestEvent($event);

        $this->assertSame(["custd.environment" => "preview-pr-9"], $sent()[0]["labels"]);
    }

    public function testNoEnvironmentLabelWhenNothingDeclaresOne(): void
    {
        [$client, $sent] = $this->client();
        $client->ingestEvent($this->event());

        $this->assertArrayNotHasKey("labels", $sent()[0]);
    }

    public function testReservedAndMalformedDeclarationsAreRejectedLocally(): void
    {
        foreach (["unclassified", "Production", "staging_env", "1st-env"] as $value) {
            try {
                CustdClient::validateEnvironmentValue($value);
                $this->fail("environment {$value} was accepted");
            } catch (\InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
        CustdClient::validateEnvironmentValue("preview-pr-9");
    }

    public function testHandWrittenReservedLabelStaysRejected(): void
    {
        $event = $this->event() + [
            "eventUuid" => "019c0000-0000-7000-8000-000000000001",
            "sessionId" => "019c0000-0000-7000-8000-000000000002",
            "anonymousId" => "019c0000-0000-7000-8000-000000000003",
        ];
        $event["labels"] = ["custd.environment" => "production"];

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("invalid key");
        CustdClient::validateEvent($event);
    }
}
