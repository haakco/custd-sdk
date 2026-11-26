<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\ReportingGeneration\ReportingPackGenerationStatus;
use HaakCo\Custd\Admin\ReportingGeneration\ReportingPackGenerationValidityListResponse;
use HaakCo\Custd\Admin\ReportingGeneration\ReportingPackRollupProvenance;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackDraft;
use HaakCo\Custd\Admin\ReportingPack\ReportingPackGeneration;

/**
 * ReportingGenerationClient reads and rolls back published reporting-pack generations and restarts a draft.
 */
final class ReportingGenerationClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Get immutable reporting pack generation.
     */
    public function get(string $generationId): ReportingPackGeneration
    {
        return ReportingPackGeneration::fromPayload($this->http->object('GET', '/api/v1/admin/reporting-packs/generations/' . rawurlencode($generationId), [], null));
    }

    /**
     * Get reporting pack generation activation status.
     */
    public function status(string $generationId): ReportingPackGenerationStatus
    {
        return ReportingPackGenerationStatus::fromPayload($this->http->object('GET', '/api/v1/admin/reporting-packs/generations/' . rawurlencode($generationId) . '/status', [], null));
    }

    /**
     * Get tenant-scoped reporting pack rollup provenance.
     */
    public function rollupProvenance(string $generationId): ReportingPackRollupProvenance
    {
        return ReportingPackRollupProvenance::fromPayload($this->http->object('GET', '/api/v1/admin/reporting-packs/generations/' . rawurlencode($generationId) . '/rollup-provenance', [], null));
    }

    /**
     * List serving reporting pack generation validity.
     */
    public function listValidity(): ReportingPackGenerationValidityListResponse
    {
        return ReportingPackGenerationValidityListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/reporting-packs/generation-validity', [], null));
    }

    /**
     * Request reporting pack rollback.
     */
    public function rollback(string $generationId): ReportingPackGeneration
    {
        return ReportingPackGeneration::fromPayload($this->http->object('POST', '/api/v1/admin/reporting-packs/generations/' . rawurlencode($generationId) . '/rollback', [], null));
    }

    /**
     * Restart reporting pack draft into a fresh revision.
     */
    public function restartDraft(string $draftId): ReportingPackDraft
    {
        return ReportingPackDraft::fromPayload($this->http->object('POST', '/api/v1/admin/reporting-packs/drafts/' . rawurlencode($draftId) . '/restart', [], null));
    }
}
