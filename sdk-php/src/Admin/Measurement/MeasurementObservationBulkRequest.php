<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementObservationBulkRequest
{
    /**
     * @param list<MeasurementObservationRow> $rows
     */
    public function __construct(
        public array $rows,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'rows' => array_map(static fn (MeasurementObservationRow $item): array => $item->serialise(), $this->rows),
        ];

        return $body;
    }
}
