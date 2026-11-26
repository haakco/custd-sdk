<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementPredictionRunNowRequest
{
    public function __construct(
        public ?string $workerId = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->workerId !== null) {
            $body['worker_id'] = $this->workerId;
        }

        return $body;
    }
}
