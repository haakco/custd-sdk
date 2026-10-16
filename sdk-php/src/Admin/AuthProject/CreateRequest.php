<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Admin\AuthProjectClient;

/**
 * CreateRequest is the named request DTO for POST /api/v1/admin/auth-projects.
 * It creates the named owning user's project ownership, identity pool and first
 * paused environment atomically.
 *
 * `audienceEntitlementMode` is required: the caller declares whether this environment admits by
 * organisation membership or only by an explicit grant for each audience. It cannot be omitted,
 * and it is immutable after creation.
 */
final readonly class CreateRequest
{
    public function __construct(
        public string $slug,
        public string $name,
        public string $environmentSlug,
        public string $identityMode,
        public string $audienceEntitlementMode,
    ) {
        AuthProjectClient::assertIdentityMode($identityMode);
        AuthProjectClient::assertAudienceEntitlementMode($audienceEntitlementMode);
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
            "audienceEntitlementMode" => $this->audienceEntitlementMode,
        ];
    }
}
