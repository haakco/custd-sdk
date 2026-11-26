<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionOutcomeList
{
    /**
     * @param list<MeasurementPredictionOutcomeRow> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionOutcomeRow::fromPayload(...), Fields::objects($payload, 'items')),
        );
    }
}
