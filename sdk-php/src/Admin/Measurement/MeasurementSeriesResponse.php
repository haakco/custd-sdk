<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementSeriesResponse
{
    public function __construct(
        public string $completionDirection,
        public string $name,
        public string $seriesCode,
        public string $seriesUuid,
        public string $source,
        public string $unitSlug,
        public ?string $unitLabel = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'completionDirection'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'seriesCode'),
            Fields::string($payload, 'seriesUuid'),
            Fields::string($payload, 'source'),
            Fields::string($payload, 'unitSlug'),
            Fields::optionalString($payload, 'unitLabel'),
        );
    }
}
