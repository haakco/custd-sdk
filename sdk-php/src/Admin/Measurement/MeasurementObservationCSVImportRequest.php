<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementObservationCSVImportRequest
{
    public function __construct(
        public string $csv,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'csv' => $this->csv,
        ];

        return $body;
    }
}
