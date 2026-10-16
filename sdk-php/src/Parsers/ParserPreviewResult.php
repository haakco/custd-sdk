<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserPreviewResult is the dry-run result of POST /api/v1/parser-preview.
 * `parsed` and `failed` summarize `results`.
 */
final readonly class ParserPreviewResult
{
    /** @param list<ParserPreviewRow> $results */
    public function __construct(
        public array $results = [],
        public int $parsed = 0,
        public int $failed = 0,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $results = [];
        foreach (Fields::objects($payload, "results") as $row) {
            $results[] = ParserPreviewRow::fromPayload($row);
        }

        return new self(
            $results,
            Fields::integer($payload, "parsed"),
            Fields::integer($payload, "failed"),
        );
    }
}
