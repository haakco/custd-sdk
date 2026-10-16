<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * ApplicationPrincipalListResponse is one page of an environment's application
 * principals.
 *
 * `principals` is empty, never null, when the environment holds no principals.
 * `nextCursor` is empty on the last page.
 */
final readonly class ApplicationPrincipalListResponse
{
    /** @param list<ApplicationPrincipalListItem> $principals */
    public function __construct(
        public array $principals = [],
        public string $nextCursor = '',
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application principal list');
        $principals = [];
        foreach (Fields::objects($object, 'principals') as $principal) {
            $principals[] = ApplicationPrincipalListItem::fromPayload($principal);
        }

        return new self($principals, Fields::optionalString($object, 'nextCursor') ?? '');
    }
}
