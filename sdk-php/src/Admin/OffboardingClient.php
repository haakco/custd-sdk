<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Offboarding\CancellationRequest;
use HaakCo\Custd\Admin\Offboarding\OffboardingCancelRequest;
use HaakCo\Custd\Admin\Offboarding\OffboardingExportResponse;
use HaakCo\Custd\Admin\Offboarding\OffboardingPreviewResponse;
use HaakCo\Custd\Admin\Offboarding\OffboardingRequestBody;
use HaakCo\Custd\Admin\Offboarding\OffboardingRequestResponse;
use HaakCo\Custd\Admin\Offboarding\OffboardingSchedule;
use HaakCo\Custd\Admin\Offboarding\OffboardingScheduleListResponse;
use HaakCo\Custd\Admin\Offboarding\OffboardingScheduleRequest;
use HaakCo\Custd\Admin\Offboarding\TenantOffboardingReceipt;

/**
 * OffboardingClient owns a tenant's offboarding: the delayed schedule, and the one-off request
 * through preview, export, streamed download, acknowledgement and the destructive execute, with its receipt.
 * A schedule body names tenantSlug, which the server checks against the authenticated client.
 */
final class OffboardingClient
{
    private readonly ApiHttp $http;

    /** @var string|callable():string */
    private readonly mixed $token;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(
        private readonly string $baseUrl,
        string|callable $token,
        private readonly mixed $transport = null,
    ) {
        $this->token = $token;
        $this->http = new ApiHttp($baseUrl, $token, is_callable($transport) ? $transport : null);
    }

    /**
     * Stream the export into `$sink` as it arrives, then verify its length and SHA-256 checksum against
     * the server's Content-Length and X-Checksum-SHA256. A mismatch throws after the bytes were written,
     * so discard the sink's contents on any exception.
     *
     * @param resource $sink A writable stream, such as an opened file.
     */
    public function download(string $requestUuid, mixed $sink): StreamedDownload
    {
        $download = Http::streamRequest(
            $this->baseUrl,
            $this->token,
            is_callable($this->transport) ? $this->transport : null,
            'GET',
            '/offboarding/requests/' . rawurlencode($requestUuid) . '/download',
            $sink,
        );
        $length = trim($download->headers['content-length'] ?? '');
        if (preg_match('/^[0-9]+$/', $length) !== 1) {
            throw new \RuntimeException('custd: offboarding download content length is invalid');
        }
        if ((int) $length !== $download->byteSize) {
            throw new \RuntimeException('custd: offboarding download content length mismatch');
        }
        $checksum = strtolower(trim($download->headers['x-checksum-sha256'] ?? ''));
        if (preg_match('/^[a-f0-9]{64}$/', $checksum) !== 1) {
            throw new \RuntimeException('custd: offboarding download checksum header is invalid');
        }
        if (!hash_equals($checksum, $download->checksumSha256)) {
            throw new \RuntimeException('custd: offboarding download checksum mismatch');
        }

        return $download;
    }

    /**
     * Run the destructive phase. It sends no body: waiver metadata comes only from the separately
     * approved server-side request, and the server refuses any a caller asserts.
     */
    public function execute(string $requestUuid): TenantOffboardingReceipt
    {
        return TenantOffboardingReceipt::fromPayload(
            $this->http->object('POST', '/api/v1/admin/offboarding/requests/' . rawurlencode($requestUuid) . '/execute'),
        );
    }

    /**
     * Schedule a delayed offboarding.
     */
    public function schedule(OffboardingScheduleRequest $request): OffboardingSchedule
    {
        return OffboardingSchedule::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/schedules', [], $request->serialise()));
    }

    /**
     * List all offboarding schedules.
     */
    public function listSchedules(): OffboardingScheduleListResponse
    {
        return OffboardingScheduleListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/offboarding/schedules', [], null));
    }

    /**
     * Get a tenant's offboarding schedule.
     */
    public function getSchedule(string $tenantSlug): OffboardingSchedule
    {
        return OffboardingSchedule::fromPayload($this->http->object('GET', '/api/v1/admin/offboarding/schedules/' . rawurlencode($tenantSlug), [], null));
    }

    /**
     * Cancel a scheduled offboarding.
     */
    public function cancelSchedule(string $tenantSlug, OffboardingCancelRequest $request): OffboardingSchedule
    {
        return OffboardingSchedule::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/schedules/' . rawurlencode($tenantSlug) . '/cancel', [], $request->serialise()));
    }

    /**
     * Request tenant offboarding.
     */
    public function requestOffboarding(OffboardingRequestBody $request, ?string $idempotencyKey = null): OffboardingRequestResponse
    {
        return OffboardingRequestResponse::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding', [], $request->serialise(), $idempotencyKey));
    }

    /**
     * Get tenant offboarding request.
     */
    public function getRequest(string $requestUuid): OffboardingRequestResponse
    {
        return OffboardingRequestResponse::fromPayload($this->http->object('GET', '/api/v1/admin/offboarding/' . rawurlencode($requestUuid), [], null));
    }

    /**
     * Cancel tenant offboarding request.
     */
    public function cancelRequest(string $requestUuid, CancellationRequest $request): OffboardingRequestResponse
    {
        return OffboardingRequestResponse::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/' . rawurlencode($requestUuid) . '/cancel', [], $request->serialise()));
    }

    /**
     * Confirm tenant offboarding request.
     */
    public function confirmRequest(string $requestUuid): OffboardingRequestResponse
    {
        return OffboardingRequestResponse::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/' . rawurlencode($requestUuid) . '/confirm', [], null));
    }

    /**
     * Preview tenant offboarding inventory.
     */
    public function preview(string $requestUuid): OffboardingPreviewResponse
    {
        return OffboardingPreviewResponse::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/requests/' . rawurlencode($requestUuid) . '/preview', [], null));
    }

    /**
     * Build the tenant offboarding export.
     */
    public function export(string $requestUuid): OffboardingExportResponse
    {
        return OffboardingExportResponse::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/requests/' . rawurlencode($requestUuid) . '/export', [], null));
    }

    /**
     * Acknowledge the saved offboarding export.
     */
    public function acknowledge(string $requestUuid): OffboardingRequestResponse
    {
        return OffboardingRequestResponse::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/requests/' . rawurlencode($requestUuid) . '/acknowledge', [], null));
    }

    /**
     * Retry destructive tenant offboarding.
     */
    public function retry(string $requestUuid): TenantOffboardingReceipt
    {
        return TenantOffboardingReceipt::fromPayload($this->http->object('POST', '/api/v1/admin/offboarding/requests/' . rawurlencode($requestUuid) . '/retry', [], null));
    }

    /**
     * Get the destructive offboarding receipt.
     */
    public function receipt(string $requestUuid): TenantOffboardingReceipt
    {
        return TenantOffboardingReceipt::fromPayload($this->http->object('GET', '/api/v1/admin/offboarding/requests/' . rawurlencode($requestUuid) . '/receipt', [], null));
    }
}
