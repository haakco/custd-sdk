<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * OffboardingClient owns the offboarding schedule and one-off request
 * surfaces. Schedule writes the effective tenant server-side; callers must
 * not pre-fill tenantSlug on the request body. The tenant is derived from
 * the authenticated client context.
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
     * The server pulls the tenant from the auth context; do not include
     * tenantSlug in the request body. The collection endpoint is POST
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
     *
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public function requestOffboarding(array $request): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding",
            $request
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
     * @return array<string, mixed>
     */
    public function cancelRequest(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/" . rawurlencode($requestUuid) . "/cancel"
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
     * surfaced verbatim; the SDK must not re-derive estimatedCount.
     *
     * @return array<string, mixed>
     */
    public function preview(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/preview"
        ) ?? [];
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
     * @return array{bytes:string, checksumSha256:string, byteSize:int}
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
     * Acknowledge records that the operator (or client) has accepted the
     * preview. After acknowledgment the server is willing to accept execute.
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
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/execute"
        ) ?? [];
    }

    /**
     * Retry re-arms an offboarding request that previously failed. The server
     * decides whether the request is retryable; the SDK does not pre-filter.
     *
     * @return array<string, mixed>
     */
    public function retry(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "POST",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/retry"
        ) ?? [];
    }

    /**
     * Receipt returns the terminal offboarding receipt for a request. The
     * sha256 digest is the signed evidence the client must retain alongside
     * its offboarding record.
     *
     * @return array<string, mixed>
     */
    public function receipt(string $requestUuid): array
    {
        return Http::request(
            $this->baseUrl,
            $this->token,
            $this->transport,
            "GET",
            "/offboarding/requests/" . rawurlencode($requestUuid) . "/receipt"
        ) ?? [];
    }
}
