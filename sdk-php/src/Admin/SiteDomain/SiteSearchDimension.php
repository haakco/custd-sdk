<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchDimension is what a page of search rows is grouped by. */
final class SiteSearchDimension
{
    public const PAGE = 'page';
    public const QUERY = 'query';
    public const COUNTRY = 'country';
    public const DEVICE = 'device';
}
