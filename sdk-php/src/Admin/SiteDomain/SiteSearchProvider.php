<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchProvider is a search engine Custd imports a domain's search numbers from. */
final class SiteSearchProvider
{
    /** Google Search Console, read through Custd's service account added as a user on the property. */
    public const GOOGLE = 'google';
    /** Bing Webmaster Tools, read with the client's own API key. */
    public const BING = 'bing';
}
