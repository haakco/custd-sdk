<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class InputSensitivity
{
    /**
     * @param list<ScatterPoint> $scatter
     */
    public function __construct(
        public string $name,
        public float $rankCorrelation,
        public float $share,
        public array $scatter = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'name'),
            Fields::number($payload, 'rankCorrelation'),
            Fields::number($payload, 'share'),
            array_map(ScatterPoint::fromPayload(...), Fields::optionalObjects($payload, 'scatter') ?? []),
        );
    }
}
