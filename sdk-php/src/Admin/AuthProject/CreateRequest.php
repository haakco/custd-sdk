<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Admin\AuthProjectClient;

/**
 * CreateRequest is the named request DTO for POST /api/v1/admin/auth-projects.
 * It creates the named owning user's project ownership, identity pool and first
 * paused environment atomically.
 */
final readonly class CreateRequest
{
    public function __construct(
        public string $slug,
        public string $name,
        public string $environmentSlug,
        public string $identityMode,
    ) {
        AuthProjectClient::assertIdentityMode($identityMode);
        if (trim($slug) === "" || trim($name) === "" || trim($environmentSlug) === "") {
            throw new \InvalidArgumentException("custd: auth-project slug, name and environmentSlug are required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return [
            "slug" => $this->slug,
            "name" => $this->name,
            "environmentSlug" => $this->environmentSlug,
            "identityMode" => $this->identityMode,
        ];
    }
}
