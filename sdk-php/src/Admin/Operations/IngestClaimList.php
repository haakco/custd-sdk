<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class IngestClaimList
{
    /**
     * @param list<IngestClaim> $claims
     */
    public function __construct(
        public array $claims,
        public bool $truncated,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(IngestClaim::fromPayload(...), Fields::objects($payload, 'claims')),
            Fields::boolean($payload, 'truncated'),
        );
    }
}
