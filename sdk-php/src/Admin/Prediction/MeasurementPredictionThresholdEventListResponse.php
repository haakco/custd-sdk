<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionThresholdEventListResponse
{
    /**
     * @param list<MeasurementPredictionThresholdEvent> $events
     */
    public function __construct(
        public array $events,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionThresholdEvent::fromPayload(...), Fields::objects($payload, 'events')),
        );
    }
}
