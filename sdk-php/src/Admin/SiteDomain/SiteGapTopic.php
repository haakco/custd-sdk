<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteGapTopic is a topic competitors cover and the Site does not, with their pages on it. */
final readonly class SiteGapTopic
{
    /**
     * @param list<string> $competitors
     * @param list<SiteGapPage> $pages
     */
    public function __construct(
        public string $topic,
        public string $label,
        public array $competitors,
        public int $pageCount,
        public array $pages,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'topic'),
            Fields::string($payload, 'label'),
            Fields::strings($payload, 'competitors'),
            Fields::integer($payload, 'pageCount'),
            array_map(SiteGapPage::fromPayload(...), Fields::objects($payload, 'pages')),
        );
    }
}
