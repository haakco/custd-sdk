<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class HistoryResponse
{
    /** @param list<Transition> $transitions */
    public function __construct(public array $transitions = [])
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(array_map(Transition::fromPayload(...), Payload::objects($payload, "transitions")));
    }
}
