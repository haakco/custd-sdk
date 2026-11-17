<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

final readonly class SiteResponseHour
{
    public function __construct(
        public string $hourStart,
        public int $checks,
        public int $upChecks,
        public ?int $avgMs = null,
        public ?int $maxMs = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'hourStart'),
            Fields::integer($payload, 'checks'),
            Fields::integer($payload, 'upChecks'),
            Fields::optionalInteger($payload, 'avgMs'),
            Fields::optionalInteger($payload, 'maxMs'),
        );
    }
}
