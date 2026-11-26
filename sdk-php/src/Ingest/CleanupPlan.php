<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupPlan is a previewed generated-data cleanup.
 */
final readonly class CleanupPlan
{
    /**
     * @param list<CleanupPlanItem> $items
     */
    public function __construct(
        public string $planUuid,
        public string $mode,
        public string $status,
        public int $selectedRows,
        public int $selectedObjects,
        public int $estimatedBytes,
        public CleanupPlanScope $scope,
        public ?string $reason = null,
        public array $items = [],
        public ?string $createdAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'planUuid'),
            Fields::string($payload, 'mode'),
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'selectedRows'),
            Fields::integer($payload, 'selectedObjects'),
            Fields::integer($payload, 'estimatedBytes'),
            CleanupPlanScope::fromPayload(Fields::object($payload, 'scope')),
            Fields::optionalString($payload, 'reason'),
            array_map(CleanupPlanItem::fromPayload(...), Fields::optionalObjects($payload, 'items') ?? []),
            Fields::optionalString($payload, 'createdAt'),
        );
    }
}
