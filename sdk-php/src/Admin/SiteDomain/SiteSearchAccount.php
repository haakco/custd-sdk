<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchAccount says which providers this Custd deployment can import from, and the Google
 * service account email the client adds as a (Restricted) user on its Search Console property.
 */
final readonly class SiteSearchAccount
{
    public function __construct(
        public bool $googleConfigured,
        public bool $bingConfigured,
        public ?string $googleServiceAccountEmail = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'googleConfigured'),
            Fields::boolean($payload, 'bingConfigured'),
            Fields::optionalString($payload, 'googleServiceAccountEmail'),
        );
    }
}
