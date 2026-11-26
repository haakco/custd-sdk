<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementPredictionStoryEvaluation
{
    /**
     * @param list<MeasurementPredictionCalibrationBucket> $calibration
     */
    public function __construct(
        public array $calibration,
        public int $negativeCount,
        public int $positiveCount,
        public int $resolvedRunCount,
        public string $windowEndAt,
        public string $windowStartAt,
        public ?float $brierScore = null,
        public ?float $logLoss = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(MeasurementPredictionCalibrationBucket::fromPayload(...), Fields::objects($payload, 'calibration')),
            Fields::integer($payload, 'negativeCount'),
            Fields::integer($payload, 'positiveCount'),
            Fields::integer($payload, 'resolvedRunCount'),
            Fields::string($payload, 'windowEndAt'),
            Fields::string($payload, 'windowStartAt'),
            Fields::optionalNumber($payload, 'brierScore'),
            Fields::optionalNumber($payload, 'logLoss'),
        );
    }
}
