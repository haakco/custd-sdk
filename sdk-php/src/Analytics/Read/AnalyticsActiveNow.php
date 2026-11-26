<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

/**
 * AnalyticsActiveNow is how many sessions are active on one site now, over the window counted.
 */
final readonly class AnalyticsActiveNow
{
    public function __construct(
        public int $activeNow,
        public int $windowSeconds,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'activeNow'),
            Fields::integer($payload, 'windowSeconds'),
        );
    }
}
