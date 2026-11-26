<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

use HaakCo\Custd\Fields;

final readonly class RetentionPolicy
{
    /**
     * @param array<string, int> $lastAffectedCounts
     * @param RetentionClass::* $retentionClass
     * @param RetentionScope::* $scope
     */
    public function __construct(
        public string $effectiveAt,
        public int $id,
        public array $lastAffectedCounts,
        public bool $legalHold,
        public int $maxAgeSeconds,
        public int $precedence,
        public string $retentionClass,
        public string $scope,
        public ?int $auditId = null,
        public ?int $companyId = null,
        public ?string $expiresAt = null,
        public ?string $lastError = null,
        public ?string $lastResult = null,
        public ?string $legalHoldUntil = null,
        public ?string $nextRunAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'effectiveAt'),
            Fields::integer($payload, 'id'),
            Fields::integerMap($payload, 'lastAffectedCounts', true),
            Fields::boolean($payload, 'legalHold'),
            Fields::integer($payload, 'maxAgeSeconds'),
            Fields::integer($payload, 'precedence'),
            Fields::string($payload, 'retentionClass'),
            Fields::string($payload, 'scope'),
            Fields::optionalInteger($payload, 'auditId'),
            Fields::optionalInteger($payload, 'companyId'),
            Fields::optionalString($payload, 'expiresAt'),
            Fields::optionalString($payload, 'lastError'),
            Fields::optionalString($payload, 'lastResult'),
            Fields::optionalString($payload, 'legalHoldUntil'),
            Fields::optionalString($payload, 'nextRunAt'),
        );
    }
}
