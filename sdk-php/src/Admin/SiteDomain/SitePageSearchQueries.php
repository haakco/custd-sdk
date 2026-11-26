<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePageSearchQueries is what one page ranks for: its busiest Search Console queries (at most
 * maxQueries) and whether its title, description and h1 use them, title options built from them,
 * and the domain's pages that mention them and could link here. state says why the lists are
 * empty; window is null until an import.
 */
final readonly class SitePageSearchQueries
{
    /**
     * @param list<SitePageSearchQuery> $queries
     * @param list<SitePageTitleOption> $titleOptions
     * @param list<SitePageLinkSource> $linkSources
     * @param SitePageQueriesState::* $state
     */
    public function __construct(
        public string $domainUuid,
        public string $url,
        public string $state,
        public int $maxQueries,
        public array $queries,
        public array $titleOptions,
        public array $linkSources,
        public ?SitePageSearchWindow $window = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $window = Fields::optionalObject($payload, 'window');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'state'),
            Fields::integer($payload, 'maxQueries'),
            array_map(SitePageSearchQuery::fromPayload(...), Fields::objects($payload, 'queries')),
            array_map(SitePageTitleOption::fromPayload(...), Fields::objects($payload, 'titleOptions')),
            array_map(SitePageLinkSource::fromPayload(...), Fields::objects($payload, 'linkSources')),
            $window === null ? null : SitePageSearchWindow::fromPayload($window),
        );
    }
}
