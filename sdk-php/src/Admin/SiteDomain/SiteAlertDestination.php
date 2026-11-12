<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAlertDestination is where one Site's finding and outage alerts go. A null emailRecipient
 * means the tenant's own alert destinations; a set one emails that Site's alerts there instead.
 */
final readonly class SiteAlertDestination
{
    public function __construct(
        public string $siteUuid,
        public ?string $emailRecipient = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'siteUuid'), Fields::optionalString($payload, 'emailRecipient'));
    }
}
