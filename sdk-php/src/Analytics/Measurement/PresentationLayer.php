<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class PresentationLayer
{
    /**
     * @param list<PresentationPoint> $points
     * @param PresentationLayerRole::* $role
     * @param PresentationLayerYKind::* $yKind
     */
    public function __construct(
        public string $label,
        public array $points,
        public string $role,
        public string $yKind,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            array_map(PresentationPoint::fromPayload(...), Fields::objects($payload, 'points')),
            Fields::string($payload, 'role'),
            Fields::string($payload, 'yKind'),
        );
    }
}
