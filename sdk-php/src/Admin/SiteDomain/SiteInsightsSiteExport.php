<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteInsightsSiteExport is the domain's Site: project context, keyword lists, web domains and topic trends. */
final readonly class SiteInsightsSiteExport
{
    public function __construct(
        public SiteProjectContext $projectContext,
        public SiteKeywordLists $keywordLists,
        public SiteWebDomains $webDomains,
        public SiteTopicTrends $topicTrends,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteProjectContext::fromPayload(Fields::object($payload, 'projectContext')),
            SiteKeywordLists::fromPayload(Fields::object($payload, 'keywordLists')),
            SiteWebDomains::fromPayload(Fields::object($payload, 'webDomains')),
            SiteTopicTrends::fromPayload(Fields::object($payload, 'topicTrends')),
        );
    }
}
