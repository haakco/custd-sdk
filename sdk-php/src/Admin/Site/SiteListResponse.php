<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

use HaakCo\Custd\Fields;

final readonly class SiteListResponse
{
    /**
     * @param list<Site> $sites
     */
    public function __construct(
        public array $sites,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(Site::fromPayload(...), Fields::objects($payload, 'sites')),
        );
    }
}
