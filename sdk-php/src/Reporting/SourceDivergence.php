<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class SourceDivergence
{
    public function __construct(
        public bool $detected,
        public ?float $absoluteDifference = null,
        public ?float $relativeDifference = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'detected'),
            Fields::optionalNumber($payload, 'absoluteDifference'),
            Fields::optionalNumber($payload, 'relativeDifference'),
        );
    }
}
