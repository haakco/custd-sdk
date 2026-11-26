<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteRankingsSource names the values of SiteRankings.source.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteRankingsSource
{
    public const NOT_CONNECTED = 'not_connected';
    public const PENDING = 'pending';
    public const ACTIVE = 'active';
    public const FAILING = 'failing';
    public const REVOKED = 'revoked';
}
