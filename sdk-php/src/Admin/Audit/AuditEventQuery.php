<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

/**
 * AuditEventQuery filters the audit trail. Scope is tenant or global; a system administrator names the tenant
 * with companySlug and may filter a global read by affectedTenantSlug. Since and until are RFC 3339 timestamps.
 * Limit and cursor page a list; an export ignores them.
 */
final readonly class AuditEventQuery
{
    public function __construct(
        public ?string $scope = null,
        public ?string $companySlug = null,
        public ?string $affectedTenantSlug = null,
        public ?string $since = null,
        public ?string $until = null,
        public ?string $actorKind = null,
        public ?string $actorReference = null,
        public ?string $action = null,
        public ?string $resourceType = null,
        public ?string $resourceId = null,
        public ?string $outcome = null,
        public ?string $correlationId = null,
        public ?int $limit = null,
        public ?string $cursor = null,
    ) {
    }

    /** @return array<string, string|int|null> */
    public function filters(): array
    {
        return [
            'scope' => $this->scope,
            'companySlug' => $this->companySlug,
            'affectedTenantSlug' => $this->affectedTenantSlug,
            'since' => $this->since,
            'until' => $this->until,
            'actorKind' => $this->actorKind,
            'actorReference' => $this->actorReference,
            'action' => $this->action,
            'resourceType' => $this->resourceType,
            'resourceId' => $this->resourceId,
            'outcome' => $this->outcome,
            'correlationId' => $this->correlationId,
        ];
    }

    /** @return array<string, string|int|null> */
    public function page(): array
    {
        return $this->filters() + ['limit' => $this->limit, 'cursor' => $this->cursor];
    }
}
