<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementObservationBulkResponse
{
    /**
     * @param list<MeasurementObservationResult> $results
     */
    public function __construct(
        public int $accepted,
        public string $importId,
        public int $rejected,
        public array $results,
        public ?string $completedTargetUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'accepted'),
            Fields::string($payload, 'importId'),
            Fields::integer($payload, 'rejected'),
            array_map(MeasurementObservationResult::fromPayload(...), Fields::objects($payload, 'results')),
            Fields::optionalString($payload, 'completedTargetUuid'),
        );
    }
}
