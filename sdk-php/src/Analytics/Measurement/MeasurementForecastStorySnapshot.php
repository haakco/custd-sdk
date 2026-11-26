<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastStorySnapshot
{
    /**
     * @param list<MeasurementForecastWarning> $warnings
     */
    public function __construct(
        public string $asOfAt,
        public string $generatedAt,
        public int $inputCount,
        public string $intervalState,
        public string $method,
        public string $movement,
        public MeasurementForecastStoryPercentiles $percentiles,
        public string $runUuid,
        public int $sampleCount,
        public string $status,
        public ?string $horizonEndAt = null,
        public ?string $inputHash = null,
        public ?float $observedValue = null,
        public ?float $outputProbability = null,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'asOfAt'),
            Fields::string($payload, 'generatedAt'),
            Fields::integer($payload, 'inputCount'),
            Fields::string($payload, 'intervalState'),
            Fields::string($payload, 'method'),
            Fields::string($payload, 'movement'),
            MeasurementForecastStoryPercentiles::fromPayload(Fields::object($payload, 'percentiles')),
            Fields::string($payload, 'runUuid'),
            Fields::integer($payload, 'sampleCount'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'horizonEndAt'),
            Fields::optionalString($payload, 'inputHash'),
            Fields::optionalNumber($payload, 'observedValue'),
            Fields::optionalNumber($payload, 'outputProbability'),
            array_map(MeasurementForecastWarning::fromPayload(...), Fields::optionalObjects($payload, 'warnings') ?? []),
        );
    }
}
