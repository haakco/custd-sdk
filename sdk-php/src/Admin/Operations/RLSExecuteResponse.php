<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSExecuteResponse
{
    /**
     * @param list<RLSPolicyDiff> $diff
     * @param RlsExecuteOutcome::* $outcome
     */
    public function __construct(
        public array $diff,
        public string $finishedAt,
        public string $outcome,
        public string $planUuid,
        public string $rollbackSql,
        public string $startedAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(RLSPolicyDiff::fromPayload(...), Fields::objects($payload, 'diff')),
            Fields::string($payload, 'finished_at'),
            Fields::string($payload, 'outcome'),
            Fields::string($payload, 'plan_uuid'),
            Fields::string($payload, 'rollback_sql'),
            Fields::string($payload, 'started_at'),
        );
    }
}
