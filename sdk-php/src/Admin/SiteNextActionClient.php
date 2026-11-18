<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

use HaakCo\Custd\Admin\SiteDomain\SiteNextActions;
use HaakCo\Custd\Admin\SiteDomain\SitePortfolioSummary;

/**
 * SiteNextActionClient reads what to do next: one domain's status and most important actions, and
 * the portfolio of every domain, worst first. Custd ranks them once, in a fixed order that never
 * depends on AI. It is reached through SiteDomainClient::nextActions(). A site-bound credential
 * reads only its own Site; a site_insights.read credential (ProvisioningClient's
 * SCOPE_TEMPLATE_SITE_INSIGHTS_READ) reads these two calls for every Site and nothing else.
 */
final class SiteNextActionClient
{
    public function __construct(private readonly SiteDomainHttp $http)
    {
    }

    /** Read the domain's status and its most important next actions. */
    public function forDomain(string $domainUuid, ?string $companySlug = null): SiteNextActions
    {
        return SiteNextActions::fromPayload(
            $this->http->send('GET', SiteDomainHttp::item($domainUuid) . '/next-actions', [], $companySlug)
        );
    }

    /** Read every domain's status, open findings and first action, worst first. */
    public function portfolioSummary(?string $companySlug = null): SitePortfolioSummary
    {
        return SitePortfolioSummary::fromPayload(
            $this->http->send('GET', SiteDomainHttp::COLLECTION . '/portfolio-summary', [], $companySlug)
        );
    }
}
