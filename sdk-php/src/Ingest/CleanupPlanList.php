<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupPlanList is the tenant's recent cleanup plans.
 */
final readonly class CleanupPlanList
{
    /**
     * @param list<CleanupPlan> $plans
     */
    public function __construct(
        public array $plans,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(CleanupPlan::fromPayload(...), Fields::objects($payload, 'plans')),
        );
    }
}
