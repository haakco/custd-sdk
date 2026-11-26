<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStoryDelivery
{
    /**
     * @param list<MeasurementForecastStoryEstimate> $estimates
     */
    public function __construct(
        public array $estimates,
        public ?string $targetDate = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementForecastStoryEstimate::fromPayload(...), Fields::objects($payload, 'estimates')),
            Fields::optionalString($payload, 'targetDate'),
        );
    }
}
