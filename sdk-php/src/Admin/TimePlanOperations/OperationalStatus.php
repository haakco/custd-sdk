<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlanOperations;

use HaakCo\Custd\Fields;

final readonly class OperationalStatus
{
    public function __construct(
        public int $activeRuns,
        public string $checkedAt,
        public int $failedOutbox,
        public int $pendingOutbox,
        public int $publishedOutbox,
        public int $staleRuns,
        public ?string $oldestFailureAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'activeRuns'),
            Fields::string($payload, 'checkedAt'),
            Fields::integer($payload, 'failedOutbox'),
            Fields::integer($payload, 'pendingOutbox'),
            Fields::integer($payload, 'publishedOutbox'),
            Fields::integer($payload, 'staleRuns'),
            Fields::optionalString($payload, 'oldestFailureAt'),
        );
    }
}
