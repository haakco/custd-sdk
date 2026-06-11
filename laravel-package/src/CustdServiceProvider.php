<?php

declare(strict_types=1);

namespace HaakCo\LaravelCustd;

use HaakCo\Custd\CustdClient;
use HaakCo\Custd\FileQueueStore;
use HaakCo\Custd\QueueStore;
use Illuminate\Support\ServiceProvider;

final class CustdServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . "/../config/custd.php", "custd");

        $this->app->singleton("custd", function (): CustdClient {
            $config = $this->app["config"]->get("custd", []);
            return new CustdClient(
                rtrim((string) ($config["base_url"] ?? ""), "/"),
                $this->token($config),
                $this->options($config),
            );
        });

        $this->app->alias("custd", CustdClient::class);
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__ . "/../config/custd.php" => config_path("custd.php"),
        ], "custd-config");
    }

    /**
     * @param array<string, mixed> $config
     */
    private function token(array $config): ?string
    {
        $token = (string) ($config["token"] ?? "");
        return $token !== "" ? $token : null;
    }

    /**
     * @param array<string, mixed> $config
     * @return array<string, mixed>
     */
    private function options(array $config): array
    {
        return array_filter([
            "oauth" => $this->oauthOptions($config["oauth"] ?? []),
            "batch" => $this->batchOptions($config["batch"] ?? []),
            "queue" => $this->queueOptions($config["queue"] ?? []),
        ], static fn (?array $value): bool => $value !== null);
    }

    /**
     * @param mixed $config
     * @return array<string, mixed>|null
     */
    private function oauthOptions(mixed $config): ?array
    {
        if (!is_array($config) || (string) ($config["client_id"] ?? "") === "") {
            return null;
        }

        return [
            "client_id" => (string) $config["client_id"],
            "client_secret" => (string) ($config["client_secret"] ?? ""),
            "token_url" => (string) ($config["token_url"] ?? ""),
            "audience" => (string) ($config["audience"] ?? ""),
            "scopes" => array_values($config["scopes"] ?? []),
        ];
    }

    /**
     * @param mixed $config
     * @return array{max_batch_size:int}|null
     */
    private function batchOptions(mixed $config): ?array
    {
        if (!is_array($config)) {
            return null;
        }

        $maxBatchSize = (int) ($config["max_batch_size"] ?? 0);
        return $maxBatchSize > 0 ? ["max_batch_size" => $maxBatchSize] : null;
    }

    /**
     * @param mixed $config
     * @return array{enabled:bool, max_size:int, store?:QueueStore}|null
     */
    private function queueOptions(mixed $config): ?array
    {
        if (!is_array($config)) {
            return null;
        }

        $options = [
            "enabled" => (bool) ($config["enabled"] ?? false),
            "max_size" => (int) ($config["max_size"] ?? 1000),
        ];
        $store = $this->queueStore($config);
        if ($store !== null) {
            $options["store"] = $store;
        }
        return $options;
    }

    /**
     * @param array<string, mixed> $config
     */
    private function queueStore(array $config): ?QueueStore
    {
        $storeClass = $config["store"] ?? null;
        if (!is_string($storeClass) || $storeClass === "") {
            return null;
        }
        if ($storeClass === FileQueueStore::class) {
            return new FileQueueStore((string) ($config["path"] ?? storage_path("framework/cache/custd-queue.json")));
        }
        $store = $this->app->make($storeClass);
        if (!$store instanceof QueueStore) {
            throw new \InvalidArgumentException("custd.queue.store must implement " . QueueStore::class);
        }
        return $store;
    }
}
