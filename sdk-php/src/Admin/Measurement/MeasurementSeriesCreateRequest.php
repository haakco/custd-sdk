<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementSeriesCreateRequest
{
    public function __construct(
        public string $completionDirection,
        public string $name,
        public string $seriesCode,
        public string $source,
        public string $unitSlug,
        public ?string $unitLabel = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'completionDirection' => $this->completionDirection,
            'name' => $this->name,
            'seriesCode' => $this->seriesCode,
            'source' => $this->source,
            'unitSlug' => $this->unitSlug,
        ];
        if ($this->unitLabel !== null) {
            $body['unitLabel'] = $this->unitLabel;
        }

        return $body;
    }
}
