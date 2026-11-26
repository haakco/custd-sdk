<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementSignalSource
{
    public function __construct(
        public int $consecutiveFailedCount,
        public string $createdAt,
        public string $displayName,
        public bool $isPaused,
        public string $sourceKey,
        public string $sourceMode,
        public string $sourceStatus,
        public string $updatedAt,
        public string $uuid,
        public ?string $description = null,
        public ?string $lastSucceededAt = null,
        public ?int $pollIntervalSeconds = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'consecutive_failed_count'),
            Fields::string($payload, 'created_at'),
            Fields::string($payload, 'display_name'),
            Fields::boolean($payload, 'is_paused'),
            Fields::string($payload, 'source_key'),
            Fields::string($payload, 'source_mode'),
            Fields::string($payload, 'source_status'),
            Fields::string($payload, 'updated_at'),
            Fields::string($payload, 'uuid'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'last_succeeded_at'),
            Fields::optionalInteger($payload, 'poll_interval_seconds'),
        );
    }
}
