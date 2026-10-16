<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserList is the named result of GET /api/v1/parsers.
 *
 * The route emits a bare JSON array; the client wraps it so a caller never
 * handles an untyped list.
 */
final readonly class ParserList
{
    /** @param list<ParserDefinition> $parsers */
    public function __construct(
        public array $parsers = [],
    ) {
    }

    /**
     * fromPayloadList wraps the route's shape-preserving bare array.
     *
     * @param list<mixed> $payload
     */
    public static function fromPayloadList(array $payload): self
    {
        $parsers = [];
        foreach ($payload as $item) {
            $parsers[] = ParserDefinition::fromPayload(Fields::jsonObject($item, "parser"));
        }

        return new self($parsers);
    }
}
