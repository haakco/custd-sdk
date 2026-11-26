<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditListCursor
{
    public function __construct(
        public ?string $cursor = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, 'cursor'),
        );
    }
}
