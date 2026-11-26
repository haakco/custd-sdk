<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SearchPoolAccess names the values of SiteRankings.pool.
 * A value Custd adds later still decodes as a plain string.
 */
final class SearchPoolAccess
{
    public const JOINED = 'joined';
    public const NOT_JOINED = 'not_joined';
}
