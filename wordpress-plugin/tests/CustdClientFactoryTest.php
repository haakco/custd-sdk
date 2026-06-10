<?php

declare(strict_types=1);

namespace HaakCo\Custd\WordPress\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\WordPress\CustdClientFactory;
use HaakCo\Custd\WordPress\Settings;
use PHPUnit\Framework\TestCase;

final class CustdClientFactoryTest extends TestCase
{
    public function testFactoryCreatesSharedSdkClientFromStaticTokenSettings(): void
    {
        $client = (new CustdClientFactory())->create(Settings::fromArray([
            "base_url" => "http://localhost:8080",
            "company_slug" => "acme",
            "enabled" => true,
            "token" => "static-token",
        ]));

        $this->assertInstanceOf(CustdClient::class, $client);
    }

    public function testFactoryCreatesSharedSdkClientFromOAuthSettings(): void
    {
        $client = (new CustdClientFactory())->create(Settings::fromArray([
            "base_url" => "http://localhost:8080",
            "company_slug" => "acme",
            "enabled" => true,
            "oauth_client_id" => "wp-client",
            "oauth_client_secret" => "secret",
            "oauth_token_url" => "http://localhost:4444/oauth2/token",
            "oauth_audience" => "custd",
            "oauth_scopes" => "events.write",
        ]));

        $this->assertInstanceOf(CustdClient::class, $client);
    }

    public function testFactoryClientSendsImmediatelyWithoutInMemoryQueue(): void
    {
        $client = (new CustdClientFactory())->create(Settings::fromArray([
            "base_url" => "http://127.0.0.1:9",
            "company_slug" => "acme",
            "enabled" => true,
            "token" => "static-token",
        ]));

        $this->expectException(\RuntimeException::class);

        $client->track([
            "eventTypeSlug" => "wordpress.plugin_heartbeat",
            "schemaVersion" => "1.0.0",
            "timestamp" => "2026-06-10T00:00:00Z",
            "companySlug" => "acme",
            "context" => ["device" => ["type" => "server"]],
            "payload" => ["status" => "ok"],
        ]);
    }
}
