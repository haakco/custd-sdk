<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementObservationRow
{
    public function __construct(
        public string $observedAt,
        public string $seriesUuid,
        public float $value,
        public ?string $idempotencyKey = null,
        public ?string $observationUuid = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'observedAt' => $this->observedAt,
            'seriesUuid' => $this->seriesUuid,
            'value' => $this->value,
        ];
        if ($this->idempotencyKey !== null) {
            $body['idempotencyKey'] = $this->idempotencyKey;
        }
        if ($this->observationUuid !== null) {
            $body['observationUuid'] = $this->observationUuid;
        }

        return $body;
    }
}
