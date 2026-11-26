<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastDetail
{
    /**
     * @param list<MeasurementForecastLine> $posteriorLines
     */
    public function __construct(
        public MeasurementForecastHistogram $arrivalHistogram,
        public array $posteriorLines,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            MeasurementForecastHistogram::fromPayload(Fields::object($payload, 'arrivalHistogram')),
            array_map(MeasurementForecastLine::fromPayload(...), Fields::objects($payload, 'posteriorLines')),
        );
    }
}
