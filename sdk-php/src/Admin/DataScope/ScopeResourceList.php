<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * ScopeResourceList is the named result of
 * GET /api/v1/admin/data-scopes/{scopeUuid}/resources.
 */
final readonly class ScopeResourceList
{
    /** @param list<ScopeResource> $resources */
    public function __construct(
        public array $resources = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'data scope resource list response');
        $resources = [];
        foreach (Fields::objects($object, 'resources') as $resource) {
            $resources[] = ScopeResource::fromPayload($resource);
        }

        return new self($resources);
    }
}
