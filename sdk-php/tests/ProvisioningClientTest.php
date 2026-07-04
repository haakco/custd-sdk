<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class ProvisioningClientTest extends TestCase
{
    public function testDataSpacesUsePublicApi(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"slug":"agency-store-001","companyName":"Agency Store 001","parentCompanySlug":"agency","enabled":true}',
            ],
            [
                "status" => 200,
                "body" => '{"dataSpaces":[],"entitlement":{"enabled":true,"activeDataSpaces":0,"maxActiveDataSpaces":5,"maxActiveProducersPerDataSpace":3}}',
            ],
            ["status" => 204, "body" => ""],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080/", "broker-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $created = $client->provisioning()->createDataSpace([
            "slug" => "agency-store-001",
            "companyName" => "Agency Store 001",
        ]);
        $listed = $client->provisioning()->listDataSpaces();
        $client->provisioning()->revokeDataSpace("agency store/001");

        $this->assertSame("agency-store-001", $created["slug"]);
        $this->assertSame(5, $listed["entitlement"]["maxActiveDataSpaces"]);
        $this->assertSame([
            ["POST", "http://localhost:8080/api/v1/data-spaces"],
            ["GET", "http://localhost:8080/api/v1/data-spaces"],
            ["DELETE", "http://localhost:8080/api/v1/data-spaces/agency%20store%2F001"],
        ], array_map(
            static fn (array $call): array => [$call["method"], $call["url"]],
            $calls,
        ));
    }

    public function testProducerProvisioningKeepsOneTimeSecretExplicit(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"clientId":"custd-agency-store-001-webhook","clientSecret":"once","companySlug":"agency-store-001","producerSlug":"webhook","scopes":["events.write"]}',
            ],
            [
                "status" => 200,
                "body" => '[{"clientId":"custd-agency-store-001-webhook","companySlug":"agency-store-001","producerSlug":"webhook","scopes":["events.write"]}]',
            ],
            ["status" => 200, "body" => '{"clientId":"custd-x","clientSecret":"next","scopes":["events.write"]}'],
            ["status" => 204, "body" => ""],
        ];
        $calls = [];
        $client = new CustdClient("http://localhost:8080", "broker-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return array_shift($responses);
            },
        ]);

        $created = $client->provisioning()->provisionProducer([
            "companySlug" => "agency-store-001",
            "producerSlug" => "webhook",
            "scopeTemplate" => "managed-audit",
        ]);
        $producers = $client->provisioning()->listProducers("agency-store-001");
        $rotated = $client->provisioning()->rotateProducerSecret("custd/agency store");
        $client->provisioning()->revokeProducer("custd/agency store");

        $this->assertSame("once", $created["clientSecret"]);
        $this->assertSame("webhook", $producers[0]["producerSlug"]);
        $this->assertSame("next", $rotated["clientSecret"]);
        $this->assertSame([
            ["POST", "http://localhost:8080/api/v1/producer-provisioning"],
            ["GET", "http://localhost:8080/api/v1/producer-provisioning?companySlug=agency-store-001"],
            ["POST", "http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store/rotate-secret"],
            ["DELETE", "http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store"],
        ], array_map(
            static fn (array $call): array => [$call["method"], $call["url"]],
            $calls,
        ));
    }
}
