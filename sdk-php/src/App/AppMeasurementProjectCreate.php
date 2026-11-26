<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Measurement\MeasurementSeriesCreateRequest;
use HaakCo\Custd\Admin\Measurement\MeasurementTargetCreateRequest;

final readonly class AppMeasurementProjectCreate
{
    /**
     * @param list<MeasurementSeriesCreateRequest> $series
     */
    public function __construct(
        public string $kind,
        public string $name,
        public array $series,
        public MeasurementTargetCreateRequest $target,
        public ?string $description = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'kind' => $this->kind,
            'name' => $this->name,
            'series' => array_map(static fn (MeasurementSeriesCreateRequest $item): array => $item->serialise(), $this->series),
            'target' => $this->target->serialise(),
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }

        return $body;
    }
}
