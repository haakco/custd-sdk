<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Prediction;

final readonly class MeasurementPredictionActivateRequest
{
    public function __construct(
        public string $versionUuid,
        public ?string $reason = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'version_uuid' => $this->versionUuid,
        ];
        if ($this->reason !== null) {
            $body['reason'] = $this->reason;
        }

        return $body;
    }
}
