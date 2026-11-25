<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteStatusPage is the page as customers would see it: its components and latest updates. */
final readonly class SiteStatusPage
{
    /**
     * @param list<SiteStatusComponent> $components
     * @param list<SiteStatusUpdate> $updates
     */
    public function __construct(
        public string $title,
        public array $components,
        public array $updates,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'title'),
            array_map(SiteStatusComponent::fromPayload(...), Fields::objects($payload, 'components')),
            array_map(SiteStatusUpdate::fromPayload(...), Fields::objects($payload, 'updates')),
        );
    }
}
