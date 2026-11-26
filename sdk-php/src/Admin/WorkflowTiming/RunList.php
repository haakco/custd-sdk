<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\WorkflowTiming;

use HaakCo\Custd\Admin\TimePlan\Payload;

/** RunList is the bounded list of a company's observed runs. */
final readonly class RunList
{
    /** @param list<RunSummary> $items */
    public function __construct(public array $items = [])
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(array_map(RunSummary::fromPayload(...), Payload::objects($payload, 'items')));
    }
}
