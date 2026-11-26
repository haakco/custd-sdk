<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionDefinition
{
    /**
     * @param PredictionProjectKind::* $projectKind
     */
    public function __construct(
        public string $definitionKey,
        public string $displayName,
        public bool $isPaused,
        public string $projectKind,
        public string $scheduleKind,
        public string $status,
        public string $uuid,
        public ?string $activeVersionUuid = null,
        public ?int $candidateVersionCount = null,
        public ?string $candidateVersionUuid = null,
        public ?int $defaultHorizonSeconds = null,
        public ?string $description = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definition_key'),
            Fields::string($payload, 'display_name'),
            Fields::boolean($payload, 'is_paused'),
            Fields::string($payload, 'project_kind'),
            Fields::string($payload, 'schedule_kind'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'uuid'),
            Fields::optionalString($payload, 'active_version_uuid'),
            Fields::optionalInteger($payload, 'candidate_version_count'),
            Fields::optionalString($payload, 'candidate_version_uuid'),
            Fields::optionalInteger($payload, 'default_horizon_seconds'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'created_at'),
            Fields::optionalString($payload, 'updated_at'),
        );
    }
}
