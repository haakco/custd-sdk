<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd\Tests;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\FileQueueStore;
use HaakCo\Custd\QueueStore;
use HaakCo\LaravelCustd\CustdServiceProvider;
use HaakCo\LaravelCustd\Facades\Custd;
use HaakCo\LaravelCustd\Jobs\SendCustdEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
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
        $this->app["config"]->set("custd.queue.store", TestingQueueStore::class);

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
        $this->assertInstanceOf(TestingQueueStore::class, $this->clientQueueStore($client));
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
        $this->assertSame("https://custd.com", $config["base_url"]);
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

    public function testSendCustdEventJobUsesLaravelQueueTraitsAndConfigDefaults(): void
    {
        $this->app["config"]->set("custd.job.tries", 5);
        $this->app["config"]->set("custd.job.backoff", 30);

        $job = new SendCustdEvent($this->validEvent());

        $this->assertContains(Dispatchable::class, class_uses_recursive(SendCustdEvent::class));
        $this->assertContains(InteractsWithQueue::class, class_uses_recursive(SendCustdEvent::class));
        $this->assertContains(Queueable::class, class_uses_recursive(SendCustdEvent::class));
        $this->assertSame(5, $job->tries);
        $this->assertSame(30, $job->backoff);
    }

    public function testLaravelQueueStoreConfigCanResolveFileQueueStore(): void
    {
        $queuePath = sys_get_temp_dir() . "/custd-laravel-queue-" . bin2hex(random_bytes(4)) . ".json";
        $this->app["config"]->set("custd.token", "token");
        $this->app["config"]->set("custd.queue.enabled", true);
        $this->app["config"]->set("custd.queue.store", FileQueueStore::class);
        $this->app["config"]->set("custd.queue.path", $queuePath);

        $client = $this->app->make(CustdClient::class);

        try {
            $this->assertInstanceOf(FileQueueStore::class, $this->clientQueueStore($client));
        } finally {
            if (file_exists($queuePath)) {
                unlink($queuePath);
            }
        }
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

    private function clientQueueStore(CustdClient $client): QueueStore
    {
        $reflected = new \ReflectionProperty($client, "queueStore");

        return $reflected->getValue($client);
    }
}

final class TestingQueueStore implements QueueStore
{
    public function load(): array
    {
        return [];
    }

    public function save(array $events): void
    {
    }

    public function clear(): void
    {
    }
}
