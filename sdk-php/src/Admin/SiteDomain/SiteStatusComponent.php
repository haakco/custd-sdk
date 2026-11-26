<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusComponent is one component as customers see it on the status page. */
final readonly class SiteStatusComponent
{
    /**
     * @param SiteStatusComponentStatus::* $status
     */
    public function __construct(
        public string $label,
        public string $status,
        public ?string $lastCheckedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'label'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'lastCheckedAt'),
        );
    }
}
