<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemStageSignals
{
    public function __construct(
        public ?int $acceptedRawLandingFailed = null,
        public ?int $acceptedRawLandingPending = null,
        public ?int $acceptedRawLandingUploadFailures = null,
        public ?int $ackFloorStreamSequence = null,
        public ?int $ackPending = null,
        public ?float $ackPendingUtilization = null,
        public ?int $compactionBacklog = null,
        public ?int $compactionBacklogAgeSeconds = null,
        public ?bool $consumerActive = null,
        public ?int $cpuLimitMilli = null,
        public ?int $cpuMilli = null,
        public ?int $deliveredStreamSequence = null,
        public ?bool $healthProbeOk = null,
        public ?int $livenessFlapCount = null,
        public ?int $memoryLimitBytes = null,
        public ?int $memoryUsageBytes = null,
        public ?bool $metricsProbeOk = null,
        public ?int $oomKillCount = null,
        public ?int $pending = null,
        public ?int $redelivered = null,
        public ?bool $resourceMetricsOk = null,
        public ?int $restartCount = null,
        public ?int $retentionSecondsLeft = null,
        public ?int $rollupBacklog = null,
        public ?int $segmentPending = null,
        public ?bool $slowConsumer = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalInteger($payload, 'acceptedRawLandingFailed'),
            Fields::optionalInteger($payload, 'acceptedRawLandingPending'),
            Fields::optionalInteger($payload, 'acceptedRawLandingUploadFailures'),
            Fields::optionalInteger($payload, 'ackFloorStreamSequence'),
            Fields::optionalInteger($payload, 'ackPending'),
            Fields::optionalNumber($payload, 'ackPendingUtilization'),
            Fields::optionalInteger($payload, 'compactionBacklog'),
            Fields::optionalInteger($payload, 'compactionBacklogAgeSeconds'),
            Fields::optionalBoolean($payload, 'consumerActive'),
            Fields::optionalInteger($payload, 'cpuLimitMilli'),
            Fields::optionalInteger($payload, 'cpuMilli'),
            Fields::optionalInteger($payload, 'deliveredStreamSequence'),
            Fields::optionalBoolean($payload, 'healthProbeOk'),
            Fields::optionalInteger($payload, 'livenessFlapCount'),
            Fields::optionalInteger($payload, 'memoryLimitBytes'),
            Fields::optionalInteger($payload, 'memoryUsageBytes'),
            Fields::optionalBoolean($payload, 'metricsProbeOk'),
            Fields::optionalInteger($payload, 'oomKillCount'),
            Fields::optionalInteger($payload, 'pending'),
            Fields::optionalInteger($payload, 'redelivered'),
            Fields::optionalBoolean($payload, 'resourceMetricsOk'),
            Fields::optionalInteger($payload, 'restartCount'),
            Fields::optionalInteger($payload, 'retentionSecondsLeft'),
            Fields::optionalInteger($payload, 'rollupBacklog'),
            Fields::optionalInteger($payload, 'segmentPending'),
            Fields::optionalBoolean($payload, 'slowConsumer'),
        );
    }
}
