<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteWebInventoryStatus names the values of SiteWebDomain.sitemapStatus, SiteWebDomain.waybackStatus.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteWebInventoryStatus
{
    public const PENDING = 'pending';
    public const DONE = 'done';
    public const PARTIAL = 'partial';
    public const UNAVAILABLE = 'unavailable';
    public const FAILED = 'failed';
}
