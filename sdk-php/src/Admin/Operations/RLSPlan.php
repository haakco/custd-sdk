<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class RLSPlan
{
    /**
     * @param list<string> $targetTables
     */
    public function __construct(
        public string $actorId,
        public string $catalogDigest,
        public string $catalogVersion,
        public string $createdAt,
        public string $expiresAt,
        public string $gitCommit,
        public string $idempotencyKey,
        public string $label,
        public string $planUuid,
        public string $reversibleSqlDigest,
        public array $targetTables,
        public mixed $expectedState = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'actor_id'),
            Fields::string($payload, 'catalog_digest'),
            Fields::string($payload, 'catalog_version'),
            Fields::string($payload, 'created_at'),
            Fields::string($payload, 'expires_at'),
            Fields::string($payload, 'git_commit'),
            Fields::string($payload, 'idempotency_key'),
            Fields::string($payload, 'label'),
            Fields::string($payload, 'plan_uuid'),
            Fields::string($payload, 'reversible_sql_digest'),
            Fields::strings($payload, 'target_tables'),
            Fields::raw($payload, 'expected_state'),
        );
    }
}
