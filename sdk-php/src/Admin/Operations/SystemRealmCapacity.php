<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SystemRealmCapacity
{
    public function __construct(
        public int $declared,
        public bool $exhausted,
        public bool $observed,
        public int $occupied,
        public int $quarantined,
        public int $unavailable,
        public ?string $reason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'declared'),
            Fields::boolean($payload, 'exhausted'),
            Fields::boolean($payload, 'observed'),
            Fields::integer($payload, 'occupied'),
            Fields::integer($payload, 'quarantined'),
            Fields::integer($payload, 'unavailable'),
            Fields::optionalString($payload, 'reason'),
        );
    }
}
