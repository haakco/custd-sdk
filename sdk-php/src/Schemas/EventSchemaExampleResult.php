<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

use HaakCo\Custd\Fields;

/** EventSchemaExampleResult says whether one example event matches the schema. */
final readonly class EventSchemaExampleResult
{
    /**
     * @param list<string> $issueCodes
     * @param list<EventSchemaIssue> $issues
     */
    public function __construct(
        public int $index,
        public bool $valid,
        public array $issueCodes = [],
        public array $issues = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'index'),
            Fields::boolean($payload, 'valid'),
            Fields::optionalStrings($payload, 'issueCodes') ?? [],
            EventSchemaIssue::listFrom($payload, 'issues'),
        );
    }
}
