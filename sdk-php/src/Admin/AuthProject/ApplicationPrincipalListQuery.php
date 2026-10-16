<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ApplicationPrincipalListQuery selects one page of an environment's application
 * principals.
 *
 * `cursor` is the opaque `nextCursor` the previous page returned and is left off
 * when empty. `limit` bounds the page; Custd applies its own default of 100 and
 * maximum of 100, so a positive limit is passed through unchanged.
 */
final readonly class ApplicationPrincipalListQuery
{
    public function __construct(
        public ?string $cursor = null,
        public ?int $limit = null,
    ) {
    }
}
