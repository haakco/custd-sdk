<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SubjectExport\SubjectExportArtifactResponse;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportCreateRequest;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportListResponse;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportResponse;
use HaakCo\Custd\Admin\SubjectExport\SubjectExportScope;

/**
 * SubjectExportClient queues, reads, cancels and downloads a tenant's subject exports. A download returns the
 * stored artifact's object key and integrity metadata, which are tenant data: never log them or echo them into an
 * error message. A system administrator names the tenant with companySlug.
 */
final class SubjectExportClient
{
    /** A request may ask for one artifact scope or both; a download reads one artifact. */
    public const SCOPE_ACCESS = 'access';
    public const SCOPE_PORTABILITY = 'portability';
    public const SCOPE_BOTH = 'both';

    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Queue a subject export.
     */
    public function create(SubjectExportCreateRequest $request, ?string $companySlug = null): SubjectExportResponse
    {
        return SubjectExportResponse::fromPayload($this->http->object('POST', '/api/v1/admin/subject-exports', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * List the tenant's subject exports, newest first. A null limit uses the server default; the server accepts 1
     * to 1000.
     */
    public function list(?int $limit = null, ?string $companySlug = null): SubjectExportListResponse
    {
        return SubjectExportListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/subject-exports', ['limit' => $limit, 'companySlug' => $companySlug], null));
    }

    /**
     * Get subject export status.
     */
    public function get(string $requestId, ?string $companySlug = null): SubjectExportResponse
    {
        return SubjectExportResponse::fromPayload($this->http->object('GET', '/api/v1/admin/subject-exports/' . rawurlencode($requestId), ['companySlug' => $companySlug], null));
    }

    /**
     * Cancel a subject export.
     */
    public function cancel(string $requestId, ?string $companySlug = null): SubjectExportResponse
    {
        return SubjectExportResponse::fromPayload($this->http->object('POST', '/api/v1/admin/subject-exports/' . rawurlencode($requestId) . '/cancel', ['companySlug' => $companySlug], null));
    }

    /**
     * Download one artifact of a completed subject export. The scope is SCOPE_ACCESS or SCOPE_PORTABILITY; an
     * export past its expiry answers 410 Gone.
     */
    /** @param SubjectExportScope::ACCESS|SubjectExportScope::PORTABILITY $scope */
    public function download(string $requestId, string $scope, ?string $companySlug = null): SubjectExportArtifactResponse
    {
        return SubjectExportArtifactResponse::fromPayload($this->http->object('GET', '/api/v1/admin/subject-exports/' . rawurlencode($requestId) . '/download', ['scope' => $scope, 'companySlug' => $companySlug], null));
    }

    /**
     * Force a queued subject export.
     */
    public function force(string $requestId, string $companySlug): SubjectExportResponse
    {
        return SubjectExportResponse::fromPayload($this->http->object('POST', '/api/v1/admin/subject-exports/' . rawurlencode($requestId) . '/force', ['companySlug' => $companySlug], null));
    }
}
