<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteKeywordDemandState names the values of SiteKeywordDemandSet.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteKeywordDemandState
{
    public const AVAILABLE = 'available';
    public const NO_MARKET = 'no_market';
    public const NO_BING = 'no_bing';
}
