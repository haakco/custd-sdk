<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTopicTrendSource names the values of SiteTopicTrend.source.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteTopicTrendSource
{
    public const BRAND = 'brand';
    public const SEED = 'seed';
}
