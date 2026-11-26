<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppLink is one application item an environment owns or has shared with it. */
final readonly class AppLink
{
    public function __construct(
        public string $linkUuid,
        public string $itemUuid,
        public AppLinkKind $kind,
        public AppLinkRole $role,
        public string $createdAt,
        public string $itemExpiresAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'linkUuid'),
            Fields::string($payload, 'itemUuid'),
            AppLinkKind::from(Fields::string($payload, 'kind')),
            AppLinkRole::from(Fields::string($payload, 'role')),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'itemExpiresAt'),
        );
    }
}
