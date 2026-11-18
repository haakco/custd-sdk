<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SitePortfolioSummary is every domain the caller may see, worst first. */
final readonly class SitePortfolioSummary
{
    /**
     * @param list<SitePortfolioDomain> $domains
     */
    public function __construct(public array $domains)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(SitePortfolioDomain::fromPayload(...), Fields::objects($payload, 'domains')));
    }
}
