<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionRunList
{
    /**
     * @param list<MeasurementPredictionRunRow> $items
     */
    public function __construct(
        public array $items,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionRunRow::fromPayload(...), Fields::objects($payload, 'items')),
        );
    }
}
