<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaAuditResponse
{
    /**
     * @param list<SchemaAuditResult> $schemas
     */
    public function __construct(
        public array $schemas,
        public SchemaAuditSummary $summary,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SchemaAuditResult::fromPayload(...), Fields::objects($payload, 'schemas')),
            SchemaAuditSummary::fromPayload(Fields::object($payload, 'summary')),
        );
    }
}
