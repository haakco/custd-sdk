<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteTopicTrends lists the topic trends of a Site's brand names and keyword-list seeds. */
final readonly class SiteTopicTrends
{
    /** @param list<SiteTopicTrend> $trends */
    public function __construct(
        public string $siteUuid,
        public array $trends,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'siteUuid'),
            array_map(SiteTopicTrend::fromPayload(...), Fields::objects($payload, 'trends')),
        );
    }
}
