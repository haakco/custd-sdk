<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteNextActionTarget is where a next action is done: one of the PLACE_* values (Custd may add
 * more), and for a finding action its first finding and page. PLACE_PAGE opens that page.
 */
final readonly class SiteNextActionTarget
{
    public const PLACE_OWNERSHIP = 'ownership';
    public const PLACE_UPTIME = 'uptime';
    public const PLACE_SEARCH_SETTINGS = 'search-settings';
    public const PLACE_AUDIT = 'audit';
    public const PLACE_FINDING = 'finding';
    public const PLACE_PAGE = 'page';

    public function __construct(
        public string $place,
        public ?string $findingUuid = null,
        public ?string $pageUrl = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'place'),
            Fields::optionalString($payload, 'findingUuid'),
            Fields::optionalString($payload, 'pageUrl'),
        );
    }
}
