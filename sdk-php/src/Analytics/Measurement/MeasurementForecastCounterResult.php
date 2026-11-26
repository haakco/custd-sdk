<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastCounterResult
{
    public function __construct(
        public MeasurementForecastDetail $detail,
        public int $pooledRunCount,
        public ?MeasurementForecastInterval $completionInterval = null,
        public ?float $deadlineProbability = null,
        public ?MeasurementForecastRate $rate = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $completionInterval = Fields::optionalObject($payload, 'completionInterval');
        $rate = Fields::optionalObject($payload, 'rate');

        return new self(
            MeasurementForecastDetail::fromPayload(Fields::object($payload, 'detail')),
            Fields::integer($payload, 'pooledRunCount'),
            $completionInterval === null ? null : MeasurementForecastInterval::fromPayload($completionInterval),
            Fields::optionalNumber($payload, 'deadlineProbability'),
            $rate === null ? null : MeasurementForecastRate::fromPayload($rate),
        );
    }
}
