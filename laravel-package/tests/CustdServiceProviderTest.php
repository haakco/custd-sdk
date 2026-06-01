<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\LaravelCustd\CustdServiceProvider;
use HaakCo\LaravelCustd\Facades\Custd;
use HaakCo\LaravelCustd\Jobs\SendCustdEvent;
use Orchestra\Testbench\TestCase;

final class CustdServiceProviderTest extends TestCase
{
    public function testProviderBindsPhpSdkClientFromConfig(): void
    {
        $this->app["config"]->set("custd.base_url", "http://localhost:8080");
        $this->app["config"]->set("custd.oauth.client_id", "producer");
        $this->app["config"]->set("custd.oauth.client_secret", "secret");
        $this->app["config"]->set("custd.oauth.token_url", "http://localhost:4444/oauth2/token");
        $this->app["config"]->set("custd.oauth.audience", "custd");
        $this->app["config"]->set("custd.oauth.scopes", ["events.write"]);
        $this->app["config"]->set("custd.batch.max_batch_size", 25);
        $this->app["config"]->set("custd.queue.enabled", true);
        $this->app["config"]->set("custd.queue.max_size", 500);

        $client = $this->app->make(CustdClient::class);

        $this->assertInstanceOf(CustdClient::class, $client);
        $this->assertSame($client, $this->app->make("custd"));
        $this->assertClientPropertySame($client, "baseUrl", "http://localhost:8080");
        $this->assertClientPropertySame($client, "oauthOptions", [
            "client_id" => "producer",
            "client_secret" => "secret",
            "token_url" => "http://localhost:4444/oauth2/token",
            "audience" => "custd",
            "scopes" => ["events.write"],
        ]);
        $this->assertClientPropertySame($client, "batchOptions", ["max_batch_size" => 25]);
        $this->assertClientPropertySame($client, "queueEnabled", true);
        $this->assertClientPropertySame($client, "maxQueueSize", 500);
    }

    public function testFacadeResolvesSdkClient(): void
    {
        $this->app["config"]->set("custd.base_url", "http://localhost:8080");
        $this->app["config"]->set("custd.token", "token");

        $this->assertInstanceOf(CustdClient::class, Custd::getFacadeRoot());
    }

    public function testPublishedConfigDoesNotContainSecrets(): void
    {
        $config = require __DIR__ . "/../config/custd.php";

        $this->assertSame("", $config["token"]);
        $this->assertSame("", $config["oauth"]["client_secret"]);
        $this->assertSame("https://custd.k8.haak.co", $config["base_url"]);
    }

    public function testSendCustdEventJobResolvesClientAtHandleTime(): void
    {
        $event = $this->validEvent();
        $sent = [];
        $client = new CustdClient("http://localhost:8080", "token", [
            "queue" => ["enabled" => false],
            "http_client" => function (string $url, array $event) use (&$sent): array {
                $sent[] = $event;
                return ["status" => 202, "body" => ""];
            },
        ]);

        $this->app->instance(CustdClient::class, $client);

        $job = new SendCustdEvent($event);
        $serialized = serialize($job);

        $this->assertStringNotContainsString("secret", $serialized);

        unserialize($serialized)->handle($this->app->make(CustdClient::class));

        $this->assertSame([$event], $sent);
    }

    /**
     * @return array<class-string, int>
     */
    protected function getPackageProviders($app): array
    {
        return [CustdServiceProvider::class];
    }

    /**
     * @return array<string, mixed>
     */
    private function validEvent(): array
    {
        return [
            "eventUuid" => "evt-1",
            "eventTypeSlug" => "page-view",
            "schemaVersion" => "1.0.0",
            "timestamp" => "2026-01-24T00:00:00Z",
            "sessionId" => "sess-1",
            "anonymousId" => "anon-1",
            "companySlug" => "test-company",
            "context" => ["device" => ["type" => "server"]],
            "payload" => ["path" => "/"],
        ];
    }

    private function assertClientPropertySame(CustdClient $client, string $property, mixed $expected): void
    {
        $reflected = new \ReflectionProperty($client, $property);

        $this->assertSame($expected, $reflected->getValue($client));
    }
}
