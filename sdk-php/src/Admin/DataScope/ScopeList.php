<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * ScopeList is the named result of GET /api/v1/admin/data-scopes. The route
 * emits a `{scopes:[...]}` envelope; a bare array is never a contract.
 */
final readonly class ScopeList
{
    /** @param list<Scope> $scopes */
    public function __construct(
        public array $scopes = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'data scope list response');
        $scopes = [];
        foreach (Fields::objects($object, 'scopes') as $scope) {
            $scopes[] = Scope::fromPayload($scope);
        }

        return new self($scopes);
    }
}
