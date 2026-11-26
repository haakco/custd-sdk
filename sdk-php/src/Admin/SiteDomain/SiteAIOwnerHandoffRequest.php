<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteAIOwnerHandoffRequest asks for a one-time handoff that lets one owner of a data space the calling
 * broker manages change that tenant's AI settings. ownerSubject is the broker's opaque id for that owner.
 */
final readonly class SiteAIOwnerHandoffRequest
{
    public function __construct(
        public string $tenantSlug,
        public string $ownerSubject,
    ) {
        if (trim($tenantSlug) === '' || trim($ownerSubject) === '') {
            throw new \InvalidArgumentException('custd: an AI owner handoff needs a tenant and an owner subject');
        }
    }

    /** @return array{tenantSlug: string, ownerSubject: string} */
    public function serialise(): array
    {
        return ['tenantSlug' => $this->tenantSlug, 'ownerSubject' => $this->ownerSubject];
    }
}
