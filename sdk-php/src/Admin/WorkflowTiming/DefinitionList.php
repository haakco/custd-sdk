<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** DefinitionList is the bounded list of a company's workflow definitions. */
final readonly class DefinitionList
{
    /** @param list<Definition> $items */
    public function __construct(public array $items = [])
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(array_map(Definition::fromPayload(...), Payload::objects($payload, 'items')));
    }
}
