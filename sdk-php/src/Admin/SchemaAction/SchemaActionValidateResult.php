<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaActionValidateResult
{
    /**
     * @param list<SchemaIssue> $issues
     */
    public function __construct(
        public array $issues,
        public string $suggestedAction,
        public bool $valid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SchemaIssue::fromPayload(...), Fields::objects($payload, 'issues')),
            Fields::string($payload, 'suggestedAction'),
            Fields::boolean($payload, 'valid'),
        );
    }
}
