<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class CompletedDurationReportSummary
{
    public function __construct(
        public int $actualBlockCount,
        public bool $actualComplete,
        public int $actualTotalMs,
        public int $baselineHorizonMs,
        public int $blockCount,
        public int $cancelledBlockCount,
        public int $censoredBlockCount,
        public string $completedAt,
        public int $completedBlockCount,
        public int $currentTotalMs,
        public int $finalVarianceMs,
        public int $lostMs,
        public int $notRunBlockCount,
        public int $overrunMs,
        public string $planId,
        public int $plannedTotalMs,
        public string $runId,
        public string $runStatus,
        public int $skippedBlockCount,
        public int $streamVersion,
        public int $unusedMs,
        public string $versionId,
        public ?string $effectiveEndsAt = null,
        public ?string $effectiveStartsAt = null,
        public ?int $executableHorizonMs = null,
        public ?string $scheduledEndsAt = null,
        public ?string $scheduledStartsAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'actual_block_count'),
            Fields::boolean($payload, 'actual_complete'),
            Fields::integer($payload, 'actual_total_ms'),
            Fields::integer($payload, 'baseline_horizon_ms'),
            Fields::integer($payload, 'block_count'),
            Fields::integer($payload, 'cancelled_block_count'),
            Fields::integer($payload, 'censored_block_count'),
            Fields::string($payload, 'completed_at'),
            Fields::integer($payload, 'completed_block_count'),
            Fields::integer($payload, 'current_total_ms'),
            Fields::integer($payload, 'final_variance_ms'),
            Fields::integer($payload, 'lost_ms'),
            Fields::integer($payload, 'not_run_block_count'),
            Fields::integer($payload, 'overrun_ms'),
            Fields::string($payload, 'plan_id'),
            Fields::integer($payload, 'planned_total_ms'),
            Fields::string($payload, 'run_id'),
            Fields::string($payload, 'run_status'),
            Fields::integer($payload, 'skipped_block_count'),
            Fields::integer($payload, 'stream_version'),
            Fields::integer($payload, 'unused_ms'),
            Fields::string($payload, 'version_id'),
            Fields::optionalString($payload, 'effective_ends_at'),
            Fields::optionalString($payload, 'effective_starts_at'),
            Fields::optionalInteger($payload, 'executable_horizon_ms'),
            Fields::optionalString($payload, 'scheduled_ends_at'),
            Fields::optionalString($payload, 'scheduled_starts_at'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'actual_block_count' => $this->actualBlockCount,
            'actual_complete' => $this->actualComplete,
            'actual_total_ms' => $this->actualTotalMs,
            'baseline_horizon_ms' => $this->baselineHorizonMs,
            'block_count' => $this->blockCount,
            'cancelled_block_count' => $this->cancelledBlockCount,
            'censored_block_count' => $this->censoredBlockCount,
            'completed_at' => $this->completedAt,
            'completed_block_count' => $this->completedBlockCount,
            'current_total_ms' => $this->currentTotalMs,
            'final_variance_ms' => $this->finalVarianceMs,
            'lost_ms' => $this->lostMs,
            'not_run_block_count' => $this->notRunBlockCount,
            'overrun_ms' => $this->overrunMs,
            'plan_id' => $this->planId,
            'planned_total_ms' => $this->plannedTotalMs,
            'run_id' => $this->runId,
            'run_status' => $this->runStatus,
            'skipped_block_count' => $this->skippedBlockCount,
            'stream_version' => $this->streamVersion,
            'unused_ms' => $this->unusedMs,
            'version_id' => $this->versionId,
        ];
        if ($this->effectiveEndsAt !== null) {
            $body['effective_ends_at'] = $this->effectiveEndsAt;
        }
        if ($this->effectiveStartsAt !== null) {
            $body['effective_starts_at'] = $this->effectiveStartsAt;
        }
        if ($this->executableHorizonMs !== null) {
            $body['executable_horizon_ms'] = $this->executableHorizonMs;
        }
        if ($this->scheduledEndsAt !== null) {
            $body['scheduled_ends_at'] = $this->scheduledEndsAt;
        }
        if ($this->scheduledStartsAt !== null) {
            $body['scheduled_starts_at'] = $this->scheduledStartsAt;
        }

        return $body;
    }
}
