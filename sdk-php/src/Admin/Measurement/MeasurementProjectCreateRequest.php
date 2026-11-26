<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementProjectCreateRequest
{
    /**
     * @param list<MeasurementSeriesCreateRequest> $series
     */
    public function __construct(
        public string $kind,
        public string $name,
        public string $projectCode,
        public array $series,
        public MeasurementTargetCreateRequest $target,
        public ?string $companySlug = null,
        public ?string $description = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'kind' => $this->kind,
            'name' => $this->name,
            'projectCode' => $this->projectCode,
            'series' => array_map(static fn (MeasurementSeriesCreateRequest $item): array => $item->serialise(), $this->series),
            'target' => $this->target->serialise(),
        ];
        if ($this->companySlug !== null) {
            $body['companySlug'] = $this->companySlug;
        }
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }

        return $body;
    }
}
