<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

use HaakCo\Custd\Fields;

final readonly class MeasurementProjectRun
{
    public function __construct(
        public bool $similar,
        public ?string $forecastMethod = null,
        public ?string $seriesRootUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'similar'),
            Fields::optionalString($payload, 'forecastMethod'),
            Fields::optionalString($payload, 'seriesRootUuid'),
        );
    }
}
