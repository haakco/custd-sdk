<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteCampaignLinkList is a domain's campaign links, newest first, and the utm_source and utm_medium names to suggest. */
final readonly class SiteCampaignLinkList
{
    /** How many active campaign links a domain keeps. */
    public const MAX_LINKS = 500;

    /**
     * @param list<SiteCampaignLink> $links
     * @param list<string> $suggestedSources
     * @param list<string> $suggestedMediums
     */
    public function __construct(
        public array $links,
        public int $maxLinks,
        public array $suggestedSources,
        public array $suggestedMediums,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(SiteCampaignLink::fromPayload(...), Fields::objects($payload, 'links')),
            Fields::integer($payload, 'maxLinks'),
            Fields::strings($payload, 'suggestedSources'),
            Fields::strings($payload, 'suggestedMediums'),
        );
    }
}
