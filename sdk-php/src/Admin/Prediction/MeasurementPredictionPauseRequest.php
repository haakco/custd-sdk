<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementPredictionPauseRequest
{
    public function __construct(
        public ?string $reason = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->reason !== null) {
            $body['reason'] = $this->reason;
        }

        return $body;
    }
}
