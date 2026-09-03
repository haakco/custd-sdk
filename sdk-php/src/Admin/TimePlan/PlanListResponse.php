<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

final readonly class PlanListResponse
{
    /** @param list<Plan> $plans */
    public function __construct(public array $plans = [])
    {
    }

    /** @param array<string, mixed> $payload */
    public static function fromPayload(array $payload): self
    {
        return new self(array_map(Plan::fromPayload(...), Payload::objects($payload, "plans")));
    }
}
