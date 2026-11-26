<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteCrawlerIdentity names the values of SiteTrafficCrawler.identity.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteCrawlerIdentity
{
    public const VERIFIED = 'verified';
    public const CLAIMS_TO_BE = 'claims_to_be';
}
