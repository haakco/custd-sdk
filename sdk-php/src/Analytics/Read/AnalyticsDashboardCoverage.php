<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Read;

use HaakCo\Custd\Fields;

final readonly class AnalyticsDashboardCoverage
{
    public function __construct(
        public string $firstDay,
        public string $lastDay,
        public int $loadedDayCount,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'firstDay'),
            Fields::string($payload, 'lastDay'),
            Fields::integer($payload, 'loadedDayCount'),
        );
    }
}
