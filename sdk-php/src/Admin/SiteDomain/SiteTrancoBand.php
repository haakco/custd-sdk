<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTrancoBand names the values of SiteWebDomain.trancoBand.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteTrancoBand
{
    public const TOP_1K = 'top-1k';
    public const TOP_10K = 'top-10k';
    public const TOP_100K = 'top-100k';
    public const TOP_1M = 'top-1m';
    public const UNRANKED = 'unranked';
    public const UNKNOWN = 'unknown';
}
