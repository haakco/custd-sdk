<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteLinkSource names the values of SiteLinkSourceTotal.source.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteLinkSource
{
    public const BING = 'bing';
    public const COMMONCRAWL = 'commoncrawl';
    public const CRAWL = 'crawl';
}
