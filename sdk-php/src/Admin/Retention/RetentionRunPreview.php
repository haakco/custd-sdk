<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

use HaakCo\Custd\Fields;

final readonly class RetentionRunPreview
{
    /**
     * @param list<RetentionStoreBreakdown> $perStore
     * @param array<string, int> $lastAffectedCounts
     */
    public function __construct(
        public string $completedAt,
        public string $lastResult,
        public array $perStore,
        public string $safeNextAction,
        public string $startedAt,
        public array $lastAffectedCounts = [],
        public ?string $lastError = null,
        public ?string $nextRunAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'completedAt'),
            Fields::string($payload, 'lastResult'),
            array_map(RetentionStoreBreakdown::fromPayload(...), Fields::objects($payload, 'perStore')),
            Fields::string($payload, 'safeNextAction'),
            Fields::string($payload, 'startedAt'),
            Fields::integerMap($payload, 'lastAffectedCounts', false),
            Fields::optionalString($payload, 'lastError'),
            Fields::optionalString($payload, 'nextRunAt'),
        );
    }
}
