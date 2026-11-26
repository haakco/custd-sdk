<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionVersion
{
    public function __construct(
        public string $createdAt,
        public string $createdBy,
        public string $definitionHash,
        public int $featureCount,
        public int $sourceCount,
        public string $uuid,
        public int $versionNumber,
        public string $versionStatus,
        public string $versionUuid,
        public mixed $definition = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'created_at'),
            Fields::string($payload, 'created_by'),
            Fields::string($payload, 'definition_hash'),
            Fields::integer($payload, 'feature_count'),
            Fields::integer($payload, 'source_count'),
            Fields::string($payload, 'uuid'),
            Fields::integer($payload, 'version_number'),
            Fields::string($payload, 'version_status'),
            Fields::string($payload, 'version_uuid'),
            Fields::raw($payload, 'definition'),
        );
    }
}
