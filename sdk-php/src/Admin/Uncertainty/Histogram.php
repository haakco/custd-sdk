<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Histogram
{
    /**
     * @param list<int> $counts
     */
    public function __construct(
        public array $counts,
        public float $max,
        public float $min,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integerList($payload, 'counts'),
            Fields::number($payload, 'max'),
            Fields::number($payload, 'min'),
        );
    }
}
