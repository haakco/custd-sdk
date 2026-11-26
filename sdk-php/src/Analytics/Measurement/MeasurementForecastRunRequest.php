<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

final readonly class MeasurementForecastRunRequest
{
    public function __construct(
        public ?string $forecastFrom = null,
        public ?string $method = null,
        public ?int $sampleCount = null,
        public ?int $seed = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->forecastFrom !== null) {
            $body['forecastFrom'] = $this->forecastFrom;
        }
        if ($this->method !== null) {
            $body['method'] = $this->method;
        }
        if ($this->sampleCount !== null) {
            $body['sampleCount'] = $this->sampleCount;
        }
        if ($this->seed !== null) {
            $body['seed'] = $this->seed;
        }

        return $body;
    }
}
