<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastHistogram
{
    /**
     * @param list<MeasurementForecastHistogramBin> $bins
     */
    public function __construct(
        public array $bins,
        public int $neverCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementForecastHistogramBin::fromPayload(...), Fields::objects($payload, 'bins')),
            Fields::integer($payload, 'neverCount'),
        );
    }
}
