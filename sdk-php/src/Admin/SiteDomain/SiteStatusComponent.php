<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusComponent is one component as customers see it on the status page. */
final readonly class SiteStatusComponent
{
    public function __construct(
        public string $label,
        public SiteStatusComponentStatus $status,
        public ?string $lastCheckedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            SiteStatusComponentStatus::from(Fields::string($payload, 'status')),
            Fields::optionalString($payload, 'lastCheckedAt'),
        );
    }
}
