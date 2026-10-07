<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Admin\AuthProjectClient;

/**
 * EnvironmentCreateRequest is the named request DTO for POST
 * /api/v1/admin/auth-projects/{projectId}/environments.
 */
final readonly class EnvironmentCreateRequest
{
    public function __construct(
        public string $slug,
        public string $name,
        public string $identityMode,
    ) {
        AuthProjectClient::assertIdentityMode($identityMode);
        if (trim($slug) === "" || trim($name) === "") {
            throw new \InvalidArgumentException("custd: auth-project environment slug and name are required");
        }
    }

    /** @return array<string, mixed> */
    public function toPayload(): array
    {
        return ["slug" => $this->slug, "name" => $this->name, "identityMode" => $this->identityMode];
    }
}
