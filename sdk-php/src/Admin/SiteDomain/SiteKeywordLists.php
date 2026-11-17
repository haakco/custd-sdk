<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteKeywordLists lists a Site's keyword lists. */
final readonly class SiteKeywordLists
{
    /** @param list<SiteKeywordList> $lists */
    public function __construct(
        public string $siteUuid,
        public array $lists,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            array_map(SiteKeywordList::fromPayload(...), Fields::objects($payload, 'lists')),
        );
    }
}
