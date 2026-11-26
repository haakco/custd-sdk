<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementImportRunResponse
{
    /**
     * @param list<MeasurementObservationResult> $results
     */
    public function __construct(
        public int $accepted,
        public string $createdAt,
        public string $importId,
        public string $projectCode,
        public int $rejected,
        public array $results,
        public int $rowCount,
        public string $source,
        public ?string $completedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'accepted'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'importId'),
            Fields::string($payload, 'projectCode'),
            Fields::integer($payload, 'rejected'),
            array_map(MeasurementObservationResult::fromPayload(...), Fields::objects($payload, 'results')),
            Fields::integer($payload, 'rowCount'),
            Fields::string($payload, 'source'),
            Fields::optionalString($payload, 'completedAt'),
        );
    }
}
