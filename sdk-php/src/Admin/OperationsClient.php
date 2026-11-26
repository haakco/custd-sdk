<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\Operations\IngestClaim;
use HaakCo\Custd\Admin\Operations\IngestClaimList;
use HaakCo\Custd\Admin\Operations\IngestClaimTerminalRequest;
use HaakCo\Custd\Admin\Operations\JobRetryReceipt;
use HaakCo\Custd\Admin\Operations\JobStatusResponse;
use HaakCo\Custd\Admin\Operations\RLSExecuteRequest;
use HaakCo\Custd\Admin\Operations\RLSExecuteResponse;
use HaakCo\Custd\Admin\Operations\RLSPlan;
use HaakCo\Custd\Admin\Operations\RLSPlanRequest;
use HaakCo\Custd\Admin\Operations\RLSProofResponse;
use HaakCo\Custd\Admin\Operations\RLSStatus;
use HaakCo\Custd\Admin\Operations\SDKUsageListResponse;
use HaakCo\Custd\Admin\Operations\SDKVersionDeprecation;
use HaakCo\Custd\Admin\Operations\SDKVersionDeprecationRequest;
use HaakCo\Custd\Admin\Operations\ScheduledTaskDetailResponse;
use HaakCo\Custd\Admin\Operations\ScheduledTaskListViewResponse;
use HaakCo\Custd\Admin\Operations\ScheduledTaskRunRequest;
use HaakCo\Custd\Admin\Operations\ScheduledTaskRunResponse;
use HaakCo\Custd\Admin\Operations\SystemStatusResponse;

/**
 * OperationsClient is the platform operator's repair surface: row-level security reconciliation, scheduled
 * tasks, background jobs, system status, SDK usage and ingest claims.
 */
final class OperationsClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Get RLS catalog status.
     */
    public function rlsStatus(): RLSStatus
    {
        return RLSStatus::fromPayload($this->http->object('GET', '/api/v1/admin/rls/status', [], null));
    }

    /**
     * Create an RLS reconciliation plan.
     */
    public function createRlsPlan(RLSPlanRequest $request): RLSPlan
    {
        return RLSPlan::fromPayload($this->http->object('POST', '/api/v1/admin/rls/reconciliation-plans', [], $request->serialise()));
    }

    /**
     * Execute an RLS reconciliation plan.
     */
    public function executeRlsPlan(string $planUuid, RLSExecuteRequest $request, string $idempotencyKey): RLSExecuteResponse
    {
        return RLSExecuteResponse::fromPayload($this->http->object('POST', '/api/v1/admin/rls/reconciliation-plans/' . rawurlencode($planUuid) . '/execute', [], $request->serialise(), $idempotencyKey));
    }

    /**
     * Get an RLS reconciliation plan proof.
     */
    public function rlsPlanProof(string $planUuid): RLSProofResponse
    {
        return RLSProofResponse::fromPayload($this->http->object('GET', '/api/v1/admin/rls/reconciliation-plans/' . rawurlencode($planUuid) . '/proof', [], null));
    }

    /**
     * List scheduled tasks.
     */
    public function listScheduledTasks(): ScheduledTaskListViewResponse
    {
        return ScheduledTaskListViewResponse::fromPayload($this->http->object('GET', '/api/v1/admin/scheduled-tasks', [], null));
    }

    /**
     * Get one scheduled task with its recent runs.
     */
    public function getScheduledTask(string $taskName): ScheduledTaskDetailResponse
    {
        return ScheduledTaskDetailResponse::fromPayload($this->http->object('GET', '/api/v1/admin/scheduled-tasks/' . rawurlencode($taskName), [], null));
    }

    /**
     * Pause a scheduled task.
     */
    public function pauseScheduledTask(string $taskName): void
    {
        $this->http->none('POST', '/api/v1/admin/scheduled-tasks/' . rawurlencode($taskName) . '/pause', [], null);
    }

    /**
     * Resume a scheduled task.
     */
    public function resumeScheduledTask(string $taskName): void
    {
        $this->http->none('POST', '/api/v1/admin/scheduled-tasks/' . rawurlencode($taskName) . '/resume', [], null);
    }

    /**
     * Run scheduled task now.
     */
    public function runScheduledTask(string $taskName, ScheduledTaskRunRequest $request): ScheduledTaskRunResponse
    {
        return ScheduledTaskRunResponse::fromPayload($this->http->object('POST', '/api/v1/admin/scheduled-tasks/' . rawurlencode($taskName) . '/run', [], $request->serialise()));
    }

    /**
     * Retry a failed scheduled task run.
     */
    public function retryScheduledTaskRun(string $runUuid): void
    {
        $this->http->none('POST', '/api/v1/admin/scheduled-task-runs/' . rawurlencode($runUuid) . '/retry', [], null);
    }

    /**
     * List job and outbox status.
     */
    public function listJobs(): JobStatusResponse
    {
        return JobStatusResponse::fromPayload($this->http->object('GET', '/api/v1/admin/jobs', [], null));
    }

    /**
     * Retry a discarded job.
     */
    public function retryJob(int $jobId): JobRetryReceipt
    {
        return JobRetryReceipt::fromPayload($this->http->object('POST', '/api/v1/admin/jobs/' . rawurlencode((string) $jobId) . '/retry', [], null));
    }

    /**
     * Get system status.
     */
    public function systemStatus(): SystemStatusResponse
    {
        return SystemStatusResponse::fromPayload($this->http->object('GET', '/api/v1/admin/system/status', [], null));
    }

    /**
     * List SDK usage.
     */
    public function listSdkUsage(): SDKUsageListResponse
    {
        return SDKUsageListResponse::fromPayload($this->http->object('GET', '/api/v1/admin/sdk-usage', [], null));
    }

    /**
     * Mark an SDK version deprecated.
     */
    public function markSdkVersionDeprecated(string $sdk, string $versionScope, SDKVersionDeprecationRequest $request): SDKVersionDeprecation
    {
        return SDKVersionDeprecation::fromPayload($this->http->object('PUT', '/api/v1/admin/sdk-usage/deprecations/' . rawurlencode($sdk) . '/' . rawurlencode($versionScope), [], $request->serialise()));
    }

    /**
     * Clear an SDK version deprecation.
     */
    public function clearSdkVersionDeprecation(string $sdk, string $versionScope): void
    {
        $this->http->none('DELETE', '/api/v1/admin/sdk-usage/deprecations/' . rawurlencode($sdk) . '/' . rawurlencode($versionScope), [], null);
    }

    /**
     * List accepted raw-landing claims.
     */
    public function listIngestClaims(string $tenantSlug, ?int $limit = null): IngestClaimList
    {
        return IngestClaimList::fromPayload($this->http->object('GET', '/api/v1/admin/ingest/claims/' . rawurlencode($tenantSlug), ['limit' => $limit], null));
    }

    /**
     * Retry an accepted raw-landing claim.
     */
    public function retryIngestClaim(string $tenantSlug, string $objectUuid): IngestClaim
    {
        return IngestClaim::fromPayload($this->http->object('POST', '/api/v1/admin/ingest/claims/' . rawurlencode($tenantSlug) . '/' . rawurlencode($objectUuid) . '/retry', [], null));
    }

    /**
     * Terminally classify an accepted raw-landing claim.
     */
    public function markIngestClaimTerminal(string $tenantSlug, string $objectUuid, IngestClaimTerminalRequest $request): IngestClaim
    {
        return IngestClaim::fromPayload($this->http->object('POST', '/api/v1/admin/ingest/claims/' . rawurlencode($tenantSlug) . '/' . rawurlencode($objectUuid) . '/terminal', [], $request->serialise()));
    }
}
