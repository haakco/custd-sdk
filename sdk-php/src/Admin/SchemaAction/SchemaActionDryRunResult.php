<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SchemaAction;

use HaakCo\Custd\Fields;

final readonly class SchemaActionDryRunResult
{
    /**
     * @param list<SchemaIssue> $issues
     */
    public function __construct(
        public int $failed,
        public array $issues,
        public int $passed,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'failed'),
            array_map(SchemaIssue::fromPayload(...), Fields::objects($payload, 'issues')),
            Fields::integer($payload, 'passed'),
        );
    }
}
