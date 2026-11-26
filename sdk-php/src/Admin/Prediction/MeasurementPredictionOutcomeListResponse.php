<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionOutcomeListResponse
{
    /**
     * @param list<MeasurementPredictionOutcomeSummary> $outcomes
     */
    public function __construct(
        public array $outcomes,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionOutcomeSummary::fromPayload(...), Fields::objects($payload, 'outcomes')),
        );
    }
}
