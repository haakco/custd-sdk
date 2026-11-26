<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionRunListResponse
{
    /**
     * @param list<MeasurementPredictionRunSummary> $runs
     */
    public function __construct(
        public array $runs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionRunSummary::fromPayload(...), Fields::objects($payload, 'runs')),
        );
    }
}
