<?php

declare(strict_types=1);

namespace HaakCo\Custd;

interface QueueStore
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function load(): array;

    /**
     * @param array<int, array<string, mixed>> $events
     */
    public function save(array $events): void;

    public function clear(): void;
}

final class MemoryQueueStore implements QueueStore
{
    /** @var array<int, array<string, mixed>> */
    private array $events = [];

    public function load(): array
    {
        return $this->events;
    }

    public function save(array $events): void
    {
        $this->events = $events;
    }

    public function clear(): void
    {
        $this->events = [];
    }
}

final class FileQueueStore implements QueueStore
{
    private string $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }

    public function load(): array
    {
        if (!file_exists($this->path)) {
            return [];
        }
        $handle = $this->openExistingQueueFile("rb");
        flock($handle, LOCK_SH);
        $raw = stream_get_contents($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
        if ($raw === false || $raw === "") {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public function save(array $events): void
    {
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        if (file_exists($this->path)) {
            $this->assertSafeQueueFile();
        }

        $tmp = tempnam($dir, ".custd-queue-");
        if ($tmp === false) {
            throw new \RuntimeException("custd: failed to create queue file");
        }
        chmod($tmp, 0600);
        $handle = fopen($tmp, "wb");
        if ($handle === false) {
            unlink($tmp);
            throw new \RuntimeException("custd: failed to open queue file");
        }
        flock($handle, LOCK_EX);
        fwrite($handle, json_encode($events, JSON_THROW_ON_ERROR));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
        if (!rename($tmp, $this->path)) {
            unlink($tmp);
            throw new \RuntimeException("custd: failed to replace queue file");
        }
    }

    public function clear(): void
    {
        if (file_exists($this->path)) {
            $this->assertSafeQueueFile();
            unlink($this->path);
        }
    }

    private function assertSafeQueueFile(): void
    {
        if (is_link($this->path) || !is_file($this->path)) {
            throw new \RuntimeException("custd: unsafe queue file path");
        }
    }

    /**
     * @return resource
     */
    private function openExistingQueueFile(string $mode)
    {
        $statBefore = lstat($this->path);
        $this->assertSafeQueueFile();

        $handle = fopen($this->path, $mode);
        if ($handle === false) {
            throw new \RuntimeException("custd: failed to open queue file");
        }

        $statAfter = fstat($handle);
        if ($statBefore === false || $statAfter === false || !$this->sameFile($statBefore, $statAfter)) {
            fclose($handle);
            throw new \RuntimeException("custd: unsafe queue file path");
        }
        return $handle;
    }

    /**
     * @param array<string, int> $a
     * @param array<string, int> $b
     */
    private function sameFile(array $a, array $b): bool
    {
        return ($a["dev"] ?? null) === ($b["dev"] ?? null)
            && ($a["ino"] ?? null) === ($b["ino"] ?? null);
    }
}

final class RetryableException extends \RuntimeException
{
}

final class CustdClient
{
    private string $baseUrl;
    private ?string $token;
    /** @var array<string, mixed>|null */
    private ?array $oauthOptions;
    /** @var array{token:string, expires_at:int}|null */
    private ?array $oauthToken = null;
    /** @var array<string, mixed> */
    private array $retryOptions;
    /** @var array<string, mixed>|null */
    private ?array $batchOptions;
    private bool $queueEnabled;
    private QueueStore $queueStore;
    /** @var array<int, array<string, mixed>> */
    private array $queue;
    private int $maxQueueSize;
    /** @var callable|null */
    private $httpClient;
    /** @var callable|null */
    private $adminHttpClient;

    /**
     * @param array<string, mixed> $options Client options:
     *     - `retry`: array<string, mixed> — Retry policy. Keys are merged
     *       SHALLOWLY against the defaults below using `array_merge`, which
     *       means any key the caller supplies REPLACES the default for that
     *       key wholesale. In particular `retry_statuses` is NOT deep-merged.
     *         - `max_attempts` (int, default 3)
     *         - `base_delay_ms` (int, default 200)
     *         - `max_delay_ms` (int, default 2000)
     *         - `jitter` (float, default 0.2)
     *         - `retry_statuses` (int[], default [408, 429, 500, 502, 503, 504])
     *           — REPLACES the defaults wholesale when provided. To extend the
     *           default set, the caller MUST pass the full list (e.g.
     *           `[408, 429, 500, 502, 503, 504, 522]`). Passing only `[503]`
     *           means a 500 response surfaces as a non-retryable
     *           `\RuntimeException` instead of being retried. This is
     *           regression-tested by `testCustomRetryStatusesReplacesDefaults`
     *           and `testDefaultRetryStatusesIncludes500_502_504`.
     *     - `batch`: array{max_batch_size:int}|null
     *     - `queue`: array{enabled?:bool, store?:QueueStore, max_size?:int}
     *     - `http_client`: callable|null Custom HTTP transport. When provided,
     *       it receives `(string $url, array $payload, string $token)` and MUST
     *       return `array{status:int, body:string}`. The status is translated
     *       the same way as the built-in curl path: a status in
     *       `retry["retry_statuses"]` raises {@see RetryableException}, any
     *       other `>= 400` raises a `\RuntimeException`. The callable MAY
     *       throw `RetryableException` directly to force a retry without a
     *       status code (e.g. transport error).
     *     - `admin_http_client`: callable|null Custom admin HTTP transport.
     *       When provided, it receives
     *       `(string $method, string $url, ?array $body, string $token)` and
     *       MUST return `array{status:int, body:string}`.
     */
    public function __construct(string $baseUrl, ?string $token = null, array $options = [])
    {
        $this->baseUrl = rtrim($baseUrl, "/");
        self::assertSecureOrLocalHttp($this->baseUrl, "baseUrl");
        $this->token = $token;
        $this->oauthOptions = $options["oauth"] ?? null;
        if ($this->oauthOptions !== null) {
            self::assertSecureOrLocalHttp((string) ($this->oauthOptions["token_url"] ?? ""), "tokenUrl");
        } elseif ($this->token === null || $this->token === "") {
            throw new \InvalidArgumentException("custd: token or oauth config is required");
        }
        $this->retryOptions = array_merge([
            "max_attempts" => 3,
            "base_delay_ms" => 200,
            "max_delay_ms" => 2000,
            "jitter" => 0.2,
            "retry_statuses" => [408, 429, 500, 502, 503, 504],
        ], $options["retry"] ?? []);
        $this->batchOptions = $options["batch"] ?? null;
        $this->queueEnabled = $options["queue"]["enabled"] ?? ($this->batchOptions !== null);
        $this->queueStore = $options["queue"]["store"] ?? new MemoryQueueStore();
        $this->queue = $this->queueEnabled ? $this->queueStore->load() : [];
        $this->maxQueueSize = $options["queue"]["max_size"] ?? 1000;
        $this->httpClient = $options["http_client"] ?? null;
        $this->adminHttpClient = $options["admin_http_client"] ?? null;
    }

    public function adminTenants(): Admin\TenantClient
    {
        return new Admin\TenantClient($this->baseUrl, $this->authToken(), $this->adminHttpClient);
    }

    public function adminOAuthClients(): Admin\OAuthClient
    {
        return new Admin\OAuthClient($this->baseUrl, $this->authToken(), $this->adminHttpClient);
    }

    /**
     * @param array<string, mixed> $event
     */
    public function ingestEvent(array $event): array
    {
        $event = self::prepareEvent($event);
        self::validateEvent($event);

        return $this->sendWithRetry($event);
    }

    /**
     * @param array<string, mixed> $event
     */
    public function track(array $event): void
    {
        $event = self::prepareEvent($event);
        self::validateEvent($event);

        if (!$this->queueEnabled) {
            $this->sendWithRetry($event);
            return;
        }

        $this->enqueue($event);

        if ($this->batchOptions !== null) {
            $maxBatchSize = $this->batchOptions["max_batch_size"] ?? 0;
            if ($maxBatchSize > 0 && count($this->queue) >= $maxBatchSize) {
                $this->flush();
            }
            return;
        }

        $this->flush();
    }

    public function flush(): void
    {
        if (!$this->queueEnabled || count($this->queue) === 0) {
            return;
        }

        $maxBatchSize = $this->batchOptions["max_batch_size"] ?? count($this->queue);
        $batch = array_splice($this->queue, 0, $maxBatchSize);

        try {
            $this->sendBatchWithRetry($batch);
        } catch (\Throwable $err) {
            $this->queue = array_merge($batch, $this->queue);
            $this->queueStore->save($this->queue);
            throw $err;
        }

        $this->queueStore->save($this->queue);
    }

    /**
     * @param array<string, mixed> $event
     */
    private function enqueue(array $event): void
    {
        if (!$this->queueEnabled) {
            return;
        }

        if (count($this->queue) >= $this->maxQueueSize) {
            array_shift($this->queue);
        }

        $this->queue[] = $event;
        $this->queueStore->save($this->queue);
    }

    /**
     * @param array<string, mixed> $event
     */
    public static function validateEvent(array $event): void
    {
        $missing = [];

        foreach ([
            "eventUuid",
            "eventTypeSlug",
            "schemaVersion",
            "timestamp",
            "sessionId",
            "anonymousId",
            "companySlug",
            "context",
            "payload",
        ] as $key) {
            if (!array_key_exists($key, $event) || $event[$key] === null || $event[$key] === "") {
                $missing[] = $key;
            }
        }

        $deviceType = $event["context"]["device"]["type"] ?? null;
        if ($deviceType === null || $deviceType === "") {
            $missing[] = "context.device.type";
        }

        if (count($missing) > 0) {
            $fields = implode(", ", $missing);
            throw new \InvalidArgumentException("custd: missing required fields: {$fields}");
        }
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function createDogfoodEvent(array $input): array
    {
        $missing = [];
        foreach (["eventTypeSlug", "schemaVersion", "companySlug", "sourceSystem", "sourceCompany", "environment"] as $key) {
            if (!isset($input[$key]) || $input[$key] === "") {
                $missing[] = $key;
            }
        }
        if (count($missing) > 0) {
            throw new \InvalidArgumentException("custd: missing dogfood fields: " . implode(", ", $missing));
        }

        $payload = self::sanitizeDogfoodPayload($input["payload"] ?? []);
        $payload["sourceSystem"] = $input["sourceSystem"];
        $payload["sourceCompany"] = $input["sourceCompany"];
        $payload["environment"] = $input["environment"];
        $payload["schemaVersion"] = $input["schemaVersion"];
        if (isset($input["correlationId"]) && $input["correlationId"] !== "") {
            $payload["correlationId"] = $input["correlationId"];
        }

        return self::prepareEvent([
            "eventTypeSlug" => $input["eventTypeSlug"],
            "schemaVersion" => $input["schemaVersion"],
            "timestamp" => gmdate("Y-m-d\\TH:i:s\\Z"),
            "companySlug" => $input["companySlug"],
            "context" => ["device" => ["type" => "server"]],
            "payload" => $payload,
        ]);
    }

    /**
     * @param array<string, mixed> $event
     * @return array<string, mixed>
     */
    private static function prepareEvent(array $event): array
    {
        if (!isset($event["eventUuid"]) || $event["eventUuid"] === "") {
            $event["eventUuid"] = self::uuidV4();
        }
        if (!isset($event["sessionId"]) || $event["sessionId"] === "") {
            $event["sessionId"] = self::uuidV4();
        }
        if (!isset($event["anonymousId"]) || $event["anonymousId"] === "") {
            $event["anonymousId"] = self::uuidV4();
        }
        return $event;
    }

    private static function uuidV4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }

    /**
     * @param array<string, mixed> $event
     */
    private function sendWithRetry(array $event): array
    {
        $attempt = 0;
        $maxAttempts = (int) $this->retryOptions["max_attempts"];

        while (true) {
            $attempt++;
            try {
                return $this->sendRequest($event);
            } catch (RetryableException $err) {
                if ($attempt >= $maxAttempts) {
                    throw $err;
                }
                $delayMs = $this->backoffDelayMs($attempt);
                usleep($delayMs * 1000);
            }
        }
    }

    /**
     * @param array<int, array<string, mixed>> $events
     */
    private function sendBatchWithRetry(array $events): array
    {
        $attempt = 0;
        $maxAttempts = (int) $this->retryOptions["max_attempts"];

        while (true) {
            $attempt++;
            try {
                return $this->sendBatchRequest($events);
            } catch (RetryableException $err) {
                if ($attempt >= $maxAttempts) {
                    throw $err;
                }
                $delayMs = $this->backoffDelayMs($attempt);
                usleep($delayMs * 1000);
            }
        }
    }

    /**
     * @param array<string, mixed> $event
     * @return array{status:int, body:string}
     */
    private function sendRequest(array $event): array
    {
        if (is_callable($this->httpClient)) {
            // Custom HTTP transport: callable must return
            // array{status:int, body:string}. Apply the same status
            // translation as the curl path so a callable returning a 5xx
            // (instead of throwing) still triggers retry/error semantics.
            $client = $this->httpClient;
            $result = $client($this->baseUrl . "/api/v1/events", $event, $this->authToken());
            $result = $this->normalizeHttpClientResult($result);
            $this->translateStatus($result["status"]);
            return $result;
        }

        $url = $this->baseUrl . "/api/v1/events";
        $payload = json_encode($event, JSON_THROW_ON_ERROR);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "Authorization: Bearer " . $this->authToken(),
            ],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            $err = curl_error($ch);
            throw new RetryableException("custd: request failed: {$err}");
        }

        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $this->translateStatus($status);

        return [
            "status" => $status,
            "body" => is_string($response) ? $response : "",
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $events
     * @return array{status:int, body:string}
     */
    private function sendBatchRequest(array $events): array
    {
        $payload = ["events" => $events];
        $url = $this->baseUrl . "/api/v1/events/batch";

        if (is_callable($this->httpClient)) {
            $client = $this->httpClient;
            $result = $this->normalizeHttpClientResult($client($url, $payload, $this->authToken()));
            $this->translateStatus($result["status"]);
            $this->translateBatchBody($result);
            return $result;
        }

        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "Authorization: Bearer " . $this->authToken(),
            ],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            $err = curl_error($ch);
            throw new RetryableException("custd: request failed: {$err}");
        }

        $result = [
            "status" => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
            "body" => is_string($response) ? $response : "",
        ];
        $this->translateStatus($result["status"]);
        $this->translateBatchBody($result);
        return $result;
    }

    /**
     * @param array{status:int, body:string} $result
     */
    private function translateBatchBody(array $result): void
    {
        if ($result["body"] === "") {
            return;
        }

        $decoded = json_decode($result["body"], true);
        if (is_array($decoded) && ($decoded["success"] ?? true) === false) {
            throw new \RuntimeException("custd: batch request failed with status " . $result["status"]);
        }
    }

    /**
     * Apply HTTP status translation shared by the curl path and the
     * user-supplied http_client callable path.
     *
     * @throws RetryableException When the status is in retry_statuses.
     * @throws \RuntimeException When the status is >= 400 and not retryable.
     */
    private function translateStatus(int $status): void
    {
        if (in_array($status, $this->retryOptions["retry_statuses"], true)) {
            throw new RetryableException("custd: retryable status {$status}");
        }

        if ($status >= 400) {
            throw new \RuntimeException("custd: request failed with status {$status}");
        }
    }

    /**
     * Validate the return shape of a user-supplied http_client callable.
     *
     * @param mixed $result
     * @return array{status:int, body:string}
     */
    private function normalizeHttpClientResult(mixed $result): array
    {
        if (!is_array($result) || !isset($result["status"]) || !isset($result["body"])) {
            throw new \UnexpectedValueException(
                "custd: http_client callable must return array{status:int, body:string}"
            );
        }
        if (!is_int($result["status"]) || !is_string($result["body"])) {
            throw new \UnexpectedValueException(
                "custd: http_client callable must return array{status:int, body:string}"
            );
        }
        return ["status" => $result["status"], "body" => $result["body"]];
    }

    private function backoffDelayMs(int $attempt): int
    {
        $base = (float) $this->retryOptions["base_delay_ms"];
        $max = (float) $this->retryOptions["max_delay_ms"];
        $jitter = (float) $this->retryOptions["jitter"];

        $exp = $base * (2 ** ($attempt - 1));
        $capped = min($exp, $max);
        $random = (mt_rand() / mt_getrandmax()) * 2 - 1;
        $delay = $capped + ($capped * $jitter * $random);

        return (int) max(0, $delay);
    }

    private function authToken(): string
    {
        if ($this->oauthOptions === null) {
            return (string) $this->token;
        }
        $now = time();
        if ($this->oauthToken !== null && $this->oauthToken["expires_at"] > $now + 30) {
            return $this->oauthToken["token"];
        }
        $response = $this->fetchOAuthToken($this->oauthOptions);
        $accessToken = $response["access_token"] ?? null;
        if (!is_string($accessToken) || $accessToken === "") {
            throw new \RuntimeException("custd: token response missing access_token");
        }
        $expiresIn = isset($response["expires_in"]) ? (int) $response["expires_in"] : 300;
        $this->oauthToken = ["token" => $accessToken, "expires_at" => $now + $expiresIn];
        return $accessToken;
    }

    /**
     * @param array<string, mixed> $oauth
     * @return array<string, mixed>
     */
    private function fetchOAuthToken(array $oauth): array
    {
        if (is_callable($oauth["transport"] ?? null)) {
            $transport = $oauth["transport"];
            $result = $transport((string) $oauth["token_url"], self::oauthForm($oauth));
            if (!is_array($result)) {
                throw new \UnexpectedValueException("custd: oauth transport must return an array");
            }
            return $result;
        }

        $ch = curl_init((string) $oauth["token_url"]);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Content-Type: application/x-www-form-urlencoded"],
            CURLOPT_POSTFIELDS => http_build_query(self::oauthForm($oauth)),
            CURLOPT_TIMEOUT => 15,
        ]);
        $response = curl_exec($ch);
        if ($response === false) {
            throw new RetryableException("custd: token request failed: " . curl_error($ch));
        }
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($status >= 400) {
            throw new \RuntimeException("custd: token request failed with status {$status}");
        }
        $decoded = json_decode(is_string($response) ? $response : "", true, flags: JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param array<string, mixed> $oauth
     * @return array<string, mixed>
     */
    private static function oauthForm(array $oauth): array
    {
        $form = [
            "grant_type" => "client_credentials",
            "client_id" => $oauth["client_id"] ?? "",
            "client_secret" => $oauth["client_secret"] ?? "",
        ];
        if (isset($oauth["audience"]) && $oauth["audience"] !== "") {
            $form["audience"] = $oauth["audience"];
        }
        if (isset($oauth["scopes"]) && is_array($oauth["scopes"]) && count($oauth["scopes"]) > 0) {
            $form["scope"] = implode(" ", $oauth["scopes"]);
        }
        return $form;
    }

    /**
     * @param mixed $payload
     * @return array<string, mixed>
     */
    private static function sanitizeDogfoodPayload(mixed $payload): array
    {
        if (!is_array($payload)) {
            return [];
        }
        $cleaned = [];
        foreach ($payload as $key => $value) {
            if (!is_string($key) || !self::dogfoodPayloadFieldAllowed($key)) {
                continue;
            }
            $cleaned[$key] = is_array($value) ? self::sanitizeDogfoodPayload($value) : $value;
        }
        return $cleaned;
    }

    private static function dogfoodPayloadFieldAllowed(string $key): bool
    {
        $normalized = strtolower(str_replace("_", "", $key));
        $protected = ["sourcesystem", "sourcecompany", "environment", "schemaversion", "correlationid"];
        $forbidden = [
            "apikey",
            "authorization",
            "password",
            "rawapiresponse",
            "token",
            "signedurl",
            "rawprompt",
            "oauthcode",
            "devicesecret",
            "providercredential",
        ];
        return !in_array($normalized, $protected, true) && !in_array($normalized, $forbidden, true);
    }

    private static function assertSecureOrLocalHttp(string $url, string $field): void
    {
        $parts = parse_url($url);
        $scheme = $parts["scheme"] ?? "";
        $host = $parts["host"] ?? "";
        if ($scheme === "https") {
            return;
        }
        if ($scheme === "http" && in_array($host, ["localhost", "127.0.0.1", "::1"], true)) {
            return;
        }
        throw new \InvalidArgumentException("custd: {$field} must use https unless it targets localhost");
    }
}
