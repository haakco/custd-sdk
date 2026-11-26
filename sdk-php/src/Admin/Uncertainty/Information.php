<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Information
{
    /**
     * @param list<InputInformation> $inputs
     */
    public function __construct(
        public float $actProbability,
        public float $expectedValueOfPerfectInformation,
        public array $inputs,
        public string $recommended,
        public ?string $suggestedNextMeasurement = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'actProbability'),
            Fields::number($payload, 'expectedValueOfPerfectInformation'),
            array_map(InputInformation::fromPayload(...), Fields::objects($payload, 'inputs')),
            Fields::string($payload, 'recommended'),
            Fields::optionalString($payload, 'suggestedNextMeasurement'),
        );
    }
}
