<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteReferrerClass names the values of SiteTrafficReferrer.class, SiteTrafficReferrerClass.class.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteReferrerClass
{
    public const SEARCH = 'search';
    public const AI = 'ai';
    public const SOCIAL = 'social';
    public const OTHER = 'other';
}
