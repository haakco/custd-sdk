<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppLink is one application item an environment owns or has shared with it. */
final readonly class AppLink
{
    /**
     * @param AppLinkKind::* $kind
     * @param AppLinkRole::* $role
     */
    public function __construct(
        public string $linkUuid,
        public string $itemUuid,
        public string $kind,
        public string $role,
        public string $createdAt,
        public string $itemExpiresAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'linkUuid'),
            Fields::string($payload, 'itemUuid'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'role'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'itemExpiresAt'),
        );
    }
}
