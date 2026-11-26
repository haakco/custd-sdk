<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSProofResponse
{
    /**
     * @param array<string, RLSPolicySpec> $after
     * @param array<string, RLSPolicySpec> $before
     * @param list<RLSPolicyDiff> $diff
     */
    public function __construct(
        public array $after,
        public string $attemptedAt,
        public array $before,
        public string $completedAt,
        public array $diff,
        public string $planUuid,
        public string $rollbackSql,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(RLSPolicySpec::fromPayload(...), Fields::objectMap($payload, 'after', true)),
            Fields::string($payload, 'attempted_at'),
            array_map(RLSPolicySpec::fromPayload(...), Fields::objectMap($payload, 'before', true)),
            Fields::string($payload, 'completed_at'),
            array_map(RLSPolicyDiff::fromPayload(...), Fields::objects($payload, 'diff')),
            Fields::string($payload, 'plan_uuid'),
            Fields::string($payload, 'rollback_sql'),
        );
    }
}
