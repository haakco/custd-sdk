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
 * @phpstan-type OffboardingExecuteRequest array{waiver: OffboardingWaiver}
 * @phpstan-type OffboardingDownloadResponse array{
 *     requestUuid: string,
 *     downloadUrl: string,
 *     checksumSha256: string,
 *     byteSize: int,
 *     recordCount: int,
 *     generatedAt: string,
 *     expiresAt: string,
 *     previewInventoryDigest: string
 * }
 */
final class OffboardingClient
{
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
     * Download returns the durable descriptor and short-lived signed URL for
     * the offboarding export artifact. The downloadUrl is sensitive; callers
     * must not log it or echo it into error messages. The remaining fields are
     * the server's authoritative verification metadata.
     *
     * @return OffboardingDownloadResponse
     */
    public function download(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/download"
        ) ?? [];
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
     * Execute triggers the destructive phase. Callers provide a nested waiver
     * for the PHP API; the strict server body uses top-level waiver_role,
     * waiver_reason, and optional waiver_timestamp fields. An empty role
     * returns 400 waiver_required, which the SDK surfaces without retry.
     *
     * @param OffboardingExecuteRequest $request
     * @return array<string, mixed>
     */
    public function execute(string $requestUuid, array $request): array
    {
        $response = Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/execute",
            self::wireExecuteRequest($request),
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
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    private static function wireExecuteRequest(array $request): array
    {
        $waiver = $request["waiver"] ?? null;
        if (!is_array($waiver)) {
            return $request;
        }

        $wire = [
            "waiver_role" => $waiver["role"] ?? "",
            "waiver_reason" => $waiver["reason"] ?? "",
        ];
        if (array_key_exists("timestamp", $waiver)) {
            $wire["waiver_timestamp"] = $waiver["timestamp"];
        }
        return $wire;
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
