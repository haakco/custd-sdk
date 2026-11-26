<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** StorageMeasurementState says how complete a retained-storage measurement is and which inputs it read. */
final readonly class StorageMeasurementState
{
    public function __construct(
        public int $sourceWatermark,
        public string $completenessState,
        public int $calculationVersion,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'sourceWatermark'),
            Fields::string($payload, 'completenessState'),
            Fields::integer($payload, 'calculationVersion'),
        );
    }
}
