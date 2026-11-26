<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

use HaakCo\Custd\Fields;

final readonly class RetentionRunRecord
{
    /**
     * @param array<string, int> $lastAffectedCounts
     */
    public function __construct(
        public string $endAt,
        public array $lastAffectedCounts,
        public string $lastResult,
        public string $startAt,
        public ?int $auditId = null,
        public ?string $lastError = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'endAt'),
            Fields::integerMap($payload, 'lastAffectedCounts', true),
            Fields::string($payload, 'lastResult'),
            Fields::string($payload, 'startAt'),
            Fields::optionalInteger($payload, 'auditId'),
            Fields::optionalString($payload, 'lastError'),
        );
    }
}
