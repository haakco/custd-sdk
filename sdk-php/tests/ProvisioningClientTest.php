<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\Provisioning\DataSpaceCreateRequest;
use HaakCo\Custd\Provisioning\ProducerEnvironmentUpdateRequest;
use HaakCo\Custd\Provisioning\ProducerReservationStatus;
use HaakCo\Custd\Provisioning\ProvisionProducerRequest;
use PHPUnit\Framework\TestCase;

final class ProvisioningClientTest extends TestCase
{
    public function testDataSpacesSendTypedRequestsAndNameTheParent(): void
    {
        $calls = [];
        $client = self::client($calls, [
            ["status" => 201, "body" => '{"slug":"agency-store-001","companyName":"Agency Store 001","parentCompanySlug":"agency","enabled":true}'],
            ["status" => 200, "body" => '{"dataSpaces":null,"entitlement":{"enabled":true,"activeDataSpaces":0,"maxActiveDataSpaces":5,"maxActiveProducersPerDataSpace":3}}'],
            ["status" => 200, "body" => '{"reservations":[{"producerSlug":"webhook","parentCompanySlug":"agency","childCompanySlug":"agency-store-001","reservedAt":"t","expiresAt":"t","status":"pending","maxTtlSeconds":3600}]}'],
            ["status" => 204, "body" => ""],
        ]);

        $created = $client->provisioning()->createDataSpace(new DataSpaceCreateRequest("agency-store-001", "Agency Store 001"), "agency");
        $listed = $client->provisioning()->listDataSpaces();
        $reservations = $client->provisioning()->listProducerReservations("agency store/001");
        $client->provisioning()->revokeDataSpace("agency store/001", "agency");

        $this->assertSame("agency", $created->parentCompanySlug);
        $this->assertSame([], $listed->dataSpaces);
        $this->assertSame(5, $listed->entitlement->maxActiveDataSpaces);
        $this->assertSame(ProducerReservationStatus::PENDING, $reservations->reservations[0]->status);
        $this->assertSame(["slug" => "agency-store-001", "companyName" => "Agency Store 001"], $calls[0]["body"]);
        $this->assertSame([
            "POST http://localhost:8080/api/v1/data-spaces?parentCompanySlug=agency",
            "GET http://localhost:8080/api/v1/data-spaces",
            "GET http://localhost:8080/api/v1/data-spaces/agency%20store%2F001/producer-reservations",
            "DELETE http://localhost:8080/api/v1/data-spaces/agency%20store%2F001?parentCompanySlug=agency",
        ], array_map(static fn (array $call): string => $call["method"] . " " . $call["url"], $calls));
    }

    public function testProducerProvisioningKeepsOneTimeSecretExplicit(): void
    {
        $calls = [];
        $client = self::client($calls, [
            ["status" => 201, "body" => '{"baseUrl":"https://custd.test","tokenUrl":"https://auth.test/token","audience":"custd","companySlug":"agency-store-001","producerSlug":"webhook","clientId":"custd-webhook","clientSecret":"once","scopes":["events.write"],"allowedEnvironments":null}'],
            ["status" => 200, "body" => '{"producers":[{"clientId":"custd-webhook","companySlug":"agency-store-001","producerSlug":"webhook","scopes":["events.write"],"allowedEnvironments":null}]}'],
            ["status" => 200, "body" => '{"clientId":"custd-webhook","companySlug":"agency-store-001","producerSlug":"webhook","scopes":["events.write"],"allowedEnvironments":["staging"],"environment":"staging"}'],
            ["status" => 204, "body" => ""],
        ]);

        $created = $client->provisioning()->provisionProducer(
            new ProvisionProducerRequest("agency-store-001", "webhook", scopeTemplate: "managed-audit")
        );
        $producers = $client->provisioning()->listProducers("agency-store-001");
        $updated = $client->provisioning()->updateProducerEnvironment("custd/agency store", new ProducerEnvironmentUpdateRequest("staging"));
        $client->provisioning()->revokeProducer("custd/agency store");

        $this->assertSame("once", $created->clientSecret);
        $this->assertSame([], $created->allowedEnvironments);
        $this->assertSame("webhook", $producers->producers[0]->producerSlug);
        $this->assertSame("staging", $updated->environment);
        $this->assertSame(
            ["companySlug" => "agency-store-001", "producerSlug" => "webhook", "scopeTemplate" => "managed-audit"],
            $calls[0]["body"]
        );
        $this->assertSame(["environment" => "staging"], $calls[2]["body"]);
        $this->assertSame([
            "POST http://localhost:8080/api/v1/producer-provisioning",
            "GET http://localhost:8080/api/v1/producer-provisioning?companySlug=agency-store-001",
            "PATCH http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store/environment",
            "DELETE http://localhost:8080/api/v1/producer-provisioning/custd%2Fagency%20store",
        ], array_map(static fn (array $call): string => $call["method"] . " " . $call["url"], $calls));
    }

    /**
     * @param list<array<string, mixed>> $calls
     * @param-out list<array<string, mixed>> $calls
     * @param list<array{status: int, body: string}> $responses
     */
    private static function client(array &$calls, array $responses): CustdClient
    {
        return new CustdClient("http://localhost:8080/", "broker-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body) use (&$responses, &$calls): array {
                $calls[] = compact("method", "url", "body");

                return array_shift($responses);
            },
        ]);
    }
}
