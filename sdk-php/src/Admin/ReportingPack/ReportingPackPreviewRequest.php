<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/** ReportingPackPreviewRequest previews one definition against a tenant query. */
final readonly class ReportingPackPreviewRequest
{
    public function __construct(
        public PackDefinition $definition,
        public string $tenantSlug,
        public QueryHint $query,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'definition' => $this->definition->serialise(),
            'tenantSlug' => $this->tenantSlug,
            'query' => $this->query->serialise(),
        ];
    }
}
