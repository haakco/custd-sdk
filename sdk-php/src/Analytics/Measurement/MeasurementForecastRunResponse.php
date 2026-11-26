<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementForecastRunResponse
{
    /**
     * @param array<string, string> $percentiles
     * @param array<string, string> $provenance
     * @param list<MeasurementForecastWarning> $warnings
     */
    public function __construct(
        public string $forecastRunUuid,
        public string $generatedAt,
        public int $inputCount,
        public string $method,
        public array $percentiles,
        public string $projectUuid,
        public array $provenance,
        public int $sampleCount,
        public int $seed,
        public string $status,
        public ?MeasurementForecastCounterResult $counter = null,
        public ?string $forecastFrom = null,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $counter = Fields::optionalObject($payload, 'counter');

        return new self(
            Fields::string($payload, 'forecastRunUuid'),
            Fields::string($payload, 'generatedAt'),
            Fields::integer($payload, 'inputCount'),
            Fields::string($payload, 'method'),
            Fields::stringMap($payload, 'percentiles'),
            Fields::string($payload, 'projectUuid'),
            Fields::stringMap($payload, 'provenance'),
            Fields::integer($payload, 'sampleCount'),
            Fields::integer($payload, 'seed'),
            Fields::string($payload, 'status'),
            $counter === null ? null : MeasurementForecastCounterResult::fromPayload($counter),
            Fields::optionalString($payload, 'forecastFrom'),
            array_map(MeasurementForecastWarning::fromPayload(...), Fields::optionalObjects($payload, 'warnings') ?? []),
        );
    }
}
