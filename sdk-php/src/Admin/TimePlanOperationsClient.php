<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\TimePlanOperations\CompletedDurationReport;
use HaakCo\Custd\Admin\TimePlanOperations\DefinitionMathProofResponse;
use HaakCo\Custd\Admin\TimePlanOperations\DurationObservationReadResponse;
use HaakCo\Custd\Admin\TimePlanOperations\OperationalStatus;
use HaakCo\Custd\Admin\TimePlanOperations\OutboxReplayRequest;
use HaakCo\Custd\Admin\TimePlanOperations\OutboxReplayResponse;
use HaakCo\Custd\Admin\TimePlanOperations\PredictionSnapshotList;
use HaakCo\Custd\Admin\TimePlanOperations\ProjectionLossResponse;
use HaakCo\Custd\Admin\TimePlanOperations\PublishedVersionDetails;
use HaakCo\Custd\Admin\TimePlanOperations\RunRepairResponse;

/**
 * TimePlanOperationsClient reads time-plan operational state, published versions and run reports, and repairs
 * runs and the outbox.
 */
final class TimePlanOperationsClient
{
    private readonly ApiHttp $http;

    /** @param string|callable():string $token Bearer token, or a provider run per request. */
    public function __construct(string $baseUrl, string|callable $token, ?callable $transport = null)
    {
        $this->http = new ApiHttp($baseUrl, $token, $transport);
    }

    /**
     * Run source-owned time-plan definition math proof.
     */
    public function definitionMathProof(?string $companySlug = null): DefinitionMathProofResponse
    {
        return DefinitionMathProofResponse::fromPayload($this->http->object('GET', '/api/v1/admin/time-plans/operations/definition-math', ['companySlug' => $companySlug], null));
    }

    /**
     * Read redacted time-plan operator status.
     */
    public function status(?string $companySlug = null): OperationalStatus
    {
        return OperationalStatus::fromPayload($this->http->object('GET', '/api/v1/admin/time-plans/operations/status', ['companySlug' => $companySlug], null));
    }

    /**
     * Requeue failed time-plan derived events.
     */
    public function replayOutbox(OutboxReplayRequest $request = new OutboxReplayRequest(), ?string $companySlug = null): OutboxReplayResponse
    {
        return OutboxReplayResponse::fromPayload($this->http->object('POST', '/api/v1/admin/time-plans/operations/outbox/replay', ['companySlug' => $companySlug], $request->serialise()));
    }

    /**
     * Get an immutable published time-plan version.
     */
    public function getPublishedVersion(string $planUuid, string $versionUuid, ?string $companySlug = null): PublishedVersionDetails
    {
        return PublishedVersionDetails::fromPayload($this->http->object('GET', '/api/v1/admin/time-plans/plans/' . rawurlencode($planUuid) . '/versions/' . rawurlencode($versionUuid), ['companySlug' => $companySlug], null));
    }

    /**
     * List persisted system duration observations for a run.
     */
    public function listDurationObservations(string $runUuid, ?string $companySlug = null): DurationObservationReadResponse
    {
        return DurationObservationReadResponse::fromPayload($this->http->object('GET', '/api/v1/admin/time-plans/runs/' . rawurlencode($runUuid) . '/duration-observations', ['companySlug' => $companySlug], null));
    }

    /**
     * List immutable time-plan prediction snapshots.
     */
    public function listPredictionSnapshots(string $runUuid, ?int $limit = null, ?string $companySlug = null): PredictionSnapshotList
    {
        return PredictionSnapshotList::fromPayload($this->http->object('GET', '/api/v1/admin/time-plans/runs/' . rawurlencode($runUuid) . '/predictions', ['limit' => $limit, 'companySlug' => $companySlug], null));
    }

    /**
     * Get a completed time-plan run report.
     */
    public function runReport(string $runUuid, ?string $companySlug = null): CompletedDurationReport
    {
        return CompletedDurationReport::fromPayload($this->http->object('GET', '/api/v1/admin/time-plans/runs/' . rawurlencode($runUuid) . '/report', ['companySlug' => $companySlug], null));
    }

    /**
     * Remove one generated-proof run's rebuildable projection.
     */
    public function recordProjectionLoss(string $runUuid, ?string $companySlug = null): ProjectionLossResponse
    {
        return ProjectionLossResponse::fromPayload($this->http->object('POST', '/api/v1/admin/time-plans/runs/' . rawurlencode($runUuid) . '/projection-loss', ['companySlug' => $companySlug], null));
    }

    /**
     * Rebuild a time-plan run projection from immutable history.
     */
    public function repairRun(string $runUuid, ?string $companySlug = null): RunRepairResponse
    {
        return RunRepairResponse::fromPayload($this->http->object('POST', '/api/v1/admin/time-plans/runs/' . rawurlencode($runUuid) . '/repair', ['companySlug' => $companySlug], null));
    }
}
