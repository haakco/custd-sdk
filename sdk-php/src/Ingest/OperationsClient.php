<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Admin\ApiHttp;

/**
 * OperationsClient operates the tenant's stored events on ingest-api: reprocessing, monitoring,
 * data-path diagnostics, the expired-row cleanup and integrity check, and scoped generated-data
 * cleanup plans and jobs. The credential names the tenant, except that ingest-api reads a system
 * administrator's cleanup-job tenant only from X-Custd-Effective-Company: the cleanup-job list,
 * read, proof and cancel calls send the client's acting company there, and no other call does.
 */
final class OperationsClient
{
    public const EFFECTIVE_COMPANY_HEADER = 'X-Custd-Effective-Company';

    private readonly ApiHttp $http;

    /**
     * @param string|callable():string $token Bearer token, or a provider run per request.
     * @param string|null $actingCompanySlug The company a system administrator's cleanup jobs act for; null uses the credential's own.
     */
    public function __construct(
        string $baseUrl,
        string|callable $token,
        ?callable $transport = null,
        private readonly ?string $actingCompanySlug = null,
    ) {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /** List the tenant's active ingest alerts. The route answers a bare JSON array. */
    public function monitoringAlerts(): IngestMonitoringAlertList
    {
        $alerts = $this->http->structured('GET', '/api/v1/monitoring/alerts');
        if ($alerts !== null && !is_array($alerts)) {
            throw new \UnexpectedValueException('custd: monitoring alerts response must be a JSON array');
        }
        $payload = new \stdClass();
        $payload->alerts = $alerts ?? [];

        return IngestMonitoringAlertList::fromPayload($payload);
    }

    /**
     * Read the authenticated caller's account document.
     */
    public function getAccount(): Account
    {
        return Account::fromPayload($this->http->object('GET', '/api/v1/account/me', [], null));
    }

    /**
     * Reprocess the tenant's rejected events and report each outcome.
     */
    public function reprocess(): IngestReprocessResult
    {
        return IngestReprocessResult::fromPayload($this->http->object('POST', '/api/v1/reprocess', [], null));
    }

    /**
     * Read the tenant's ingest counters.
     */
    public function monitoringSummary(): IngestMonitoringSummary
    {
        return IngestMonitoringSummary::fromPayload($this->http->object('GET', '/api/v1/monitoring/summary', [], null));
    }

    /**
     * Read the platform-wide monitoring view; system administrators only.
     */
    public function systemMonitoringSummary(): SystemMonitoringSummary
    {
        return SystemMonitoringSummary::fromPayload($this->http->object('GET', '/api/v1/system/monitoring/summary', [], null));
    }

    /**
     * Read the data-path diagnostics snapshot from its ingest route.
     */
    public function ingestDiagnostics(): IngestDiagnosticsSnapshot
    {
        return IngestDiagnosticsSnapshot::fromPayload($this->http->object('GET', '/api/v1/diagnostics/ingest', [], null));
    }

    /**
     * Read the data-path diagnostics snapshot from its buffers route.
     */
    public function bufferDiagnostics(): IngestDiagnosticsSnapshot
    {
        return IngestDiagnosticsSnapshot::fromPayload($this->http->object('GET', '/api/v1/diagnostics/buffers', [], null));
    }

    /**
     * Read the data-path diagnostics snapshot from its database route.
     */
    public function databaseDiagnostics(): IngestDiagnosticsSnapshot
    {
        return IngestDiagnosticsSnapshot::fromPayload($this->http->object('GET', '/api/v1/diagnostics/database', [], null));
    }

    /**
     * Read the data-path diagnostics snapshot from its segments route.
     */
    public function segmentDiagnostics(): IngestDiagnosticsSnapshot
    {
        return IngestDiagnosticsSnapshot::fromPayload($this->http->object('GET', '/api/v1/diagnostics/segments', [], null));
    }

    /**
     * Read the data-path diagnostics snapshot from its reporting route.
     */
    public function reportingDiagnostics(): IngestDiagnosticsSnapshot
    {
        return IngestDiagnosticsSnapshot::fromPayload($this->http->object('GET', '/api/v1/diagnostics/reporting', [], null));
    }

    /**
     * Delete the tenant's expired raw, event and rejected rows.
     */
    public function cleanup(): IngestCleanupResult
    {
        return IngestCleanupResult::fromPayload($this->http->object('POST', '/api/v1/admin/cleanup', [], null));
    }

    /**
     * Check stored events against their raw objects and list the orphans.
     */
    public function checkIntegrity(): IngestIntegrityResult
    {
        return IngestIntegrityResult::fromPayload($this->http->object('POST', '/api/v1/admin/integrity', [], null));
    }

    /**
     * List the tenant's recent cleanup plans.
     */
    public function listCleanupPlans(): CleanupPlanList
    {
        return CleanupPlanList::fromPayload($this->http->object('GET', '/api/v1/admin/cleanup/plans', [], null));
    }

    /**
     * Preview a generated-data cleanup.
     */
    public function createCleanupPlan(CleanupPlanCreateRequest $request): CleanupPlan
    {
        return CleanupPlan::fromPayload($this->http->object('POST', '/api/v1/admin/cleanup/plans', [], $request->serialise()));
    }

    /**
     * List the tenant's cleanup jobs.
     */
    public function listCleanupJobs(): CleanupJobList
    {
        return CleanupJobList::fromPayload($this->http->object('GET', '/api/v1/cleanup/jobs', [], null, null, $this->actingCompanyHeaders()));
    }

    /**
     * Enqueue a scoped cleanup job.
     */
    public function createCleanupJob(CleanupJobCreateRequest $request): CleanupJob
    {
        return CleanupJob::fromPayload($this->http->object('POST', '/api/v1/cleanup/jobs', [], $request->serialise()));
    }

    /**
     * Read one cleanup job and its phases.
     */
    public function getCleanupJob(string $uuid): CleanupJob
    {
        return CleanupJob::fromPayload($this->http->object('GET', '/api/v1/cleanup/jobs/' . rawurlencode($uuid), [], null, null, $this->actingCompanyHeaders()));
    }

    /**
     * Cancel a cleanup job and return its state.
     */
    public function cancelCleanupJob(string $uuid): CleanupJob
    {
        return CleanupJob::fromPayload($this->http->object('POST', '/api/v1/cleanup/jobs/' . rawurlencode($uuid), [], null, null, $this->actingCompanyHeaders()));
    }

    /**
     * Read a completed job's proof; an unfinished job is a conflict.
     */
    public function getCleanupJobProof(string $uuid): CleanupJobProof
    {
        return CleanupJobProof::fromPayload($this->http->object('GET', '/api/v1/cleanup/jobs/' . rawurlencode($uuid) . '/proof', [], null, null, $this->actingCompanyHeaders()));
    }

    /** @return array<string, string> */
    private function actingCompanyHeaders(): array
    {
        $company = trim($this->actingCompanySlug ?? '');

        return $company === '' ? [] : [self::EFFECTIVE_COMPANY_HEADER => $company];
    }
}
