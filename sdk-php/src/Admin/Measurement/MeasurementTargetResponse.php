<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementTargetResponse
{
    public function __construct(
        public string $name,
        public string $state,
        public string $targetCode,
        public string $targetUuid,
        public float $targetValue,
        public ?string $completedAt = null,
        public ?string $targetDate = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'name'),
            Fields::string($payload, 'state'),
            Fields::string($payload, 'targetCode'),
            Fields::string($payload, 'targetUuid'),
            Fields::number($payload, 'targetValue'),
            Fields::optionalString($payload, 'completedAt'),
            Fields::optionalString($payload, 'targetDate'),
        );
    }
}
