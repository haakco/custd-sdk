<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditChange
{
    public function __construct(
        public string $field,
        public mixed $after = null,
        public mixed $before = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'field'),
            Fields::raw($payload, 'after'),
            Fields::raw($payload, 'before'),
        );
    }
}
