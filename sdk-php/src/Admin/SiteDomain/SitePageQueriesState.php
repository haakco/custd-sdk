<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SitePageQueriesState names the values of SitePageSearchQueries.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class SitePageQueriesState
{
    public const AVAILABLE = 'available';
    public const NOT_CONNECTED = 'not_connected';
    public const NOT_IMPORTED = 'not_imported';
    public const NO_QUERIES = 'no_queries';
}
