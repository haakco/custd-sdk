<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteSearchMetricDimension names the values of SearchMetricDay.dimension.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteSearchMetricDimension
{
    public const TOTAL = 'total';
    public const PAGE = 'page';
    public const QUERY = 'query';
    public const COUNTRY = 'country';
    public const DEVICE = 'device';
}
