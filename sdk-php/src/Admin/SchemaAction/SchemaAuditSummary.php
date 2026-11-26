<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaAuditSummary
{
    public function __construct(
        public int $blocked,
        public int $compatible,
        public int $needsMigration,
        public int $total,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'blocked'),
            Fields::integer($payload, 'compatible'),
            Fields::integer($payload, 'needsMigration'),
            Fields::integer($payload, 'total'),
        );
    }
}
