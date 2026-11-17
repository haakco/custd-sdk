<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchDimension is what a page of search rows is grouped by. */
enum SiteSearchDimension: string
{
    case Page = 'page';
    case Query = 'query';
    case Country = 'country';
    case Device = 'device';
}
