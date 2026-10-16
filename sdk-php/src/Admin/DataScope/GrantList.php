<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

use HaakCo\Custd\Fields;

/**
 * GrantList is the named result of GET /api/v1/admin/data-scope-grants. The
 * route emits a `{grants:[...]}` envelope; a bare array is never a contract.
 */
final readonly class GrantList
{
    /** @param list<Grant> $grants */
    public function __construct(
        public array $grants = [],
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'data scope grant list response');
        $grants = [];
        foreach (Fields::objects($object, 'grants') as $grant) {
            $grants[] = Grant::fromPayload($grant);
        }

        return new self($grants);
    }
}
