<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

final readonly class MeasurementSimulationRunRequest
{
    public function __construct(
        public ?int $sampleCount = null,
        public ?int $seed = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->sampleCount !== null) {
            $body['sampleCount'] = $this->sampleCount;
        }
        if ($this->seed !== null) {
            $body['seed'] = $this->seed;
        }

        return $body;
    }
}
