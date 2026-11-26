<?php

declare(strict_types=1);

namespace HaakCo\Custd\Ingest;

use HaakCo\Custd\Fields;

/**
 * CleanupPlanItem is what one phase of a plan selects.
 */
final readonly class CleanupPlanItem
{
    public function __construct(
        public string $phase,
        public string $dataClass,
        public int $selectedCount,
        public int $selectedBytes,
        public ?string $storagePrefix = null,
        public ?string $executionStatus = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'phase'),
            Fields::string($payload, 'dataClass'),
            Fields::integer($payload, 'selectedCount'),
            Fields::integer($payload, 'selectedBytes'),
            Fields::optionalString($payload, 'storagePrefix'),
            Fields::optionalString($payload, 'executionStatus'),
        );
    }
}
