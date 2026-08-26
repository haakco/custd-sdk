<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * OffboardingClient owns the offboarding schedule and one-off request
 * surfaces. Schedule writes a delayed offboarding schedule. The request body
 * must include tenantSlug; the server validates it against the authenticated
 * client context before applying the tenant scope.
 *
 * @phpstan-type OffboardingRequestCreate array{confirmation: string}
 * @phpstan-type OffboardingCancelRequest array{reason: string}
 * @phpstan-type OffboardingWaiver array{role: string, reason: string, timestamp?: string}
 * @phpstan-type OffboardingDownloadResponse array{
 *     bytes: string,
 *     checksumSha256: string,
 *     byteSize: int,
 * }
 */
final class OffboardingClient
{
    private const MAX_DOWNLOAD_BYTES = 64 * 1024 * 1024;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly mixed $transport,
    ) {
    }

    /**
     * Schedule writes a delayed offboarding schedule for the effective tenant.
     * The request body must include tenantSlug and the server validates it
     * against the authenticated tenant. The collection endpoint is POST
     * /offboarding/schedules.
     *
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public function schedule(array $request): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/schedules",
            $request
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function listSchedules(): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/schedules"
        ) ?? ["schedules" => []];
    }

    /**
     * GetSchedule reads the delayed offboarding schedule for a single tenant.
     * It targets the per-tenant route GET /offboarding/schedules/{tenantSlug},
     * which is distinct from the global listSchedules collection read.
     *
     * @return array<string, mixed>
     */
    public function getSchedule(string $tenantSlug): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/schedules/" . rawurlencode($tenantSlug)
        ) ?? [];
    }

    /**
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public function cancelSchedule(string $tenantSlug, array $request): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/schedules/" . rawurlencode($tenantSlug) . "/cancel",
            $request
        ) ?? [];
    }

    /**
     * RequestOffboarding submits a one-off offboarding request for the effective
     * tenant via POST /offboarding. The confirmation field must match the tenant
     * slug the server reads from the auth context; mismatches fail with 400.
     * The optional idempotency key is sent as the Idempotency-Key header, not
     * included in the strict request body.
     *
     * @param OffboardingRequestCreate $request
     * @param string|array{idempotencyKey?: string, idempotency_key?: string}|null $options
     * @return array<string, mixed>
     */
    public function requestOffboarding(array $request, string|array|null $options = null): array
    {
        $idempotencyKey = self::idempotencyKey($options);
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding",
            $request,
            idempotencyKey: $idempotencyKey,
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function getRequest(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/" . rawurlencode($requestUuid)
        ) ?? [];
    }

    /**
     * @param OffboardingCancelRequest $request
     * @return array<string, mixed>
     */
    public function cancelRequest(string $requestUuid, array $request): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/" . rawurlencode($requestUuid) . "/cancel",
            $request,
        ) ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function confirmRequest(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/" . rawurlencode($requestUuid) . "/confirm"
        ) ?? [];
    }

    /**
     * Preview asks the server to compute the per-store inventory estimate for
     * the offboarding request. The result is server-issued and must be
     * surfaced without re-deriving estimatedCount. Durable snake_case fields
     * in each store row are normalized to the SDK's camelCase array shape.
     *
     * @return array<string, mixed>
     */
    public function preview(string $requestUuid): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/preview"
        ) ?? [];
        return self::mapPreview($response);
    }

    /**
     * Export triggers the destructive export packaging for a request. The
     * response is the per-request artifact metadata; the download URL is
     * fetched separately via download.
     *
     * @return array<string, mixed>
     */
    public function export(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/export"
        ) ?? [];
    }

    /**
     * Download returns authenticated bytes with verified checksum and length.
     *
     * @return OffboardingDownloadResponse
     */
    public function download(string $requestUuid): array
    {
        $response = Http::binaryRequest(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/download"
        );
        $body = $response["body"];
        if (strlen($body) > self::MAX_DOWNLOAD_BYTES) {
            throw new \RuntimeException("custd: offboarding download exceeds 64 MiB");
        }
        $lengthHeader = trim($response["headers"]["content-length"] ?? "");
        if (preg_match('/^[0-9]+$/', $lengthHeader) !== 1) {
            throw new \RuntimeException("custd: offboarding download content length is invalid");
        }
        $byteSize = (int) $lengthHeader;
        if ($byteSize > self::MAX_DOWNLOAD_BYTES) {
            throw new \RuntimeException("custd: offboarding download exceeds 64 MiB");
        }
        if ($byteSize !== strlen($body)) {
            throw new \RuntimeException("custd: offboarding download content length mismatch");
        }
        $checksum = strtolower(trim($response["headers"]["x-checksum-sha256"] ?? ""));
        if (preg_match('/^[a-f0-9]{64}$/', $checksum) !== 1) {
            throw new \RuntimeException("custd: offboarding download checksum header is invalid");
        }
        if (!hash_equals($checksum, hash("sha256", $body))) {
            throw new \RuntimeException("custd: offboarding download checksum mismatch");
        }
        return ["bytes" => $body, "checksumSha256" => $checksum, "byteSize" => $byteSize];
    }

    /**
     * Acknowledge records that the export was downloaded successfully and its
     * inventory was confirmed. It must not be called merely after preview.
     *
     * @return array<string, mixed>
     */
    public function acknowledge(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/acknowledge"
        ) ?? [];
    }

    /**
     * Execute triggers the destructive phase. Authorization and approval are
     * server-owned; callers cannot submit waiver metadata.
     *
     * @return array<string, mixed>
     */
    public function execute(string $requestUuid): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/execute"
        ) ?? [];
        return self::mapReceipt($response);
    }

    /**
     * Retry re-arms an offboarding request that previously failed. The server
     * decides whether the request is retryable; the SDK does not pre-filter.
     *
     * @return array<string, mixed>
     */
    public function retry(string $requestUuid): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/retry"
        ) ?? [];
        return self::mapReceipt($response);
    }

    /**
     * Receipt returns the terminal offboarding receipt for a request. The
     * sha256 is an unkeyed integrity checksum the client must retain alongside
     * its offboarding record; it is not an authenticity signature.
     *
     * @return array<string, mixed>
     */
    public function receipt(string $requestUuid): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/receipt"
        ) ?? [];
        return self::mapReceipt($response);
    }

    /**
     * @param string|array{idempotencyKey?: string, idempotency_key?: string}|null $options
     */
    private static function idempotencyKey(string|array|null $options): ?string
    {
        if (is_string($options)) {
            return trim($options) === "" ? null : trim($options);
        }
        if (!is_array($options)) {
            return null;
        }
        $key = $options["idempotencyKey"] ?? $options["idempotency_key"] ?? null;
        return is_string($key) && trim($key) !== "" ? trim($key) : null;
    }

    /**
     * @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private static function mapPreview(array $response): array
    {
        $stores = $response["stores"] ?? null;
        if (!is_array($stores)) {
            return $response;
        }

        $mappedStores = [];
        foreach ($stores as $store) {
            if (!is_array($store)) {
                $mappedStores[] = $store;
                continue;
            }
            $mapped = $store;
            self::rename($mapped, "retention_class", "retentionClass");
            self::rename($mapped, "estimated_count", "estimatedCount");
            self::rename($mapped, "source_authority", "sourceAuthority");
            $mappedStores[] = $mapped;
        }
        $response["stores"] = $mappedStores;
        return $response;
    }

    /**
     * @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private static function mapReceipt(array $response): array
    {
        $fields = [
            "company_id" => "companyId",
            "requested_by_user_id" => "requestedByUserId",
            "requested_by_actor" => "requestedByActor",
            "requested_at" => "requestedAt",
            "completed_at" => "completedAt",
            "final_state" => "finalState",
        ];
        foreach ($fields as $wire => $sdk) {
            self::rename($response, $wire, $sdk);
        }

        $rows = $response["per_store"] ?? null;
        if (!is_array($rows)) {
            return $response;
        }
        $mappedRows = [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                $mappedRows[] = $row;
                continue;
            }
            $mapped = $row;
            self::rename($mapped, "retention_class", "retentionClass");
            self::rename($mapped, "deleted_count", "deletedCount");
            self::rename($mapped, "retained_exceptions_count", "retainedExceptionsCount");
            $mappedRows[] = $mapped;
        }
        $response["perStore"] = $mappedRows;
        unset($response["per_store"]);
        return $response;
    }

    /**
     * @param array<string, mixed> $values
     */
    private static function rename(array &$values, string $from, string $to): void
    {
        if (!array_key_exists($from, $values)) {
            return;
        }
        $values[$to] = $values[$from];
        unset($values[$from]);
    }
}
