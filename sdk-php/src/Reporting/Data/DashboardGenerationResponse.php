<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardGenerationResponse
{
    /**
     * @param list<DatasetRowCount> $datasetRowCounts
     * @param list<SnapshotDatasetSchema> $datasetSchemas
     * @param ReportingDashboardGenerationState::* $state
     */
    public function __construct(
        public string $generationId,
        public string $state,
        public ?int $byteLength = null,
        public ?string $compression = null,
        public ?int $contractVersion = null,
        public array $datasetRowCounts = [],
        public array $datasetSchemas = [],
        public ?string $downloadUrl = null,
        public ?string $mediaType = null,
        public ?int $pollAfterSeconds = null,
        public ?string $snapshotSha256 = null,
        public ?string $urlExpiresAt = null,
        public ?string $validUntil = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'generationId'),
            Fields::string($payload, 'state'),
            Fields::optionalInteger($payload, 'byteLength'),
            Fields::optionalString($payload, 'compression'),
            Fields::optionalInteger($payload, 'contractVersion'),
            array_map(DatasetRowCount::fromPayload(...), Fields::optionalObjects($payload, 'datasetRowCounts') ?? []),
            array_map(SnapshotDatasetSchema::fromPayload(...), Fields::optionalObjects($payload, 'datasetSchemas') ?? []),
            Fields::optionalString($payload, 'downloadUrl'),
            Fields::optionalString($payload, 'mediaType'),
            Fields::optionalInteger($payload, 'pollAfterSeconds'),
            Fields::optionalString($payload, 'snapshotSha256'),
            Fields::optionalString($payload, 'urlExpiresAt'),
            Fields::optionalString($payload, 'validUntil'),
        );
    }
}
