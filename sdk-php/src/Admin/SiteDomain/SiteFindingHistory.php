<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteFindingHistory says when a finding was seen and whether it is fixed. */
final readonly class SiteFindingHistory
{
    public function __construct(
        public string $firstSeenAt,
        public string $lastSeenAt,
        public bool $fixed,
        public ?string $fixedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'firstSeenAt'),
            Fields::string($payload, 'lastSeenAt'),
            Fields::boolean($payload, 'fixed'),
            Fields::optionalString($payload, 'fixedAt'),
        );
    }
}
