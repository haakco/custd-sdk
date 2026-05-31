<?php

declare(strict_types=1);

namespace HaakCo\Custd\Tests;

use HaakCo\Custd\CustdClient;
use PHPUnit\Framework\TestCase;

final class AdminClientTest extends TestCase
{
    public function testAdminTenantsCreateUsesAdminApi(): void
    {
        $calls = [];
        $client = new CustdClient("http://localhost:8080/", "admin-token", [
            "admin_http_client" => function (string $method, string $url, ?array $body, string $token) use (&$calls): array {
                $calls[] = compact("method", "url", "body", "token");
                return [
                    "status" => 201,
                    "body" => '{"slug":"acme","companyName":"Acme Inc","enabled":true}',
                ];
            },
        ]);

        $tenant = $client->adminTenants()->create(["slug" => "acme", "companyName" => "Acme Inc"]);

        $this->assertSame("acme", $tenant["slug"]);
        $this->assertSame("POST", $calls[0]["method"]);
        $this->assertSame("http://localhost:8080/api/v1/admin/tenants", $calls[0]["url"]);
        $this->assertSame("admin-token", $calls[0]["token"]);
        $this->assertSame(["slug" => "acme", "companyName" => "Acme Inc"], $calls[0]["body"]);
    }

    public function testOAuthClientListDoesNotExposeClientSecret(): void
    {
        $responses = [
            [
                "status" => 201,
                "body" => '{"clientId":"custd-acme","companySlug":"acme","scopes":["events.write"],"clientSecret":"secret"}',
            ],
            [
                "status" => 200,
                "body" => '{"clients":[{"clientId":"custd-acme","companySlug":"acme","scopes":["events.write"]}]}',
            ],
        ];
        $client = new CustdClient("http://localhost:8080", "admin-token", [
            "admin_http_client" => function () use (&$responses): array {
                return array_shift($responses);
            },
        ]);

        $created = $client->adminOAuthClients()->create([
            "clientId" => "custd-acme",
            "companySlug" => "acme",
            "scopes" => ["events.write"],
        ]);
        $list = $client->adminOAuthClients()->list();

        $this->assertSame("secret", $created["clientSecret"]);
        $this->assertArrayNotHasKey("clientSecret", $list["clients"][0]);
    }
}
