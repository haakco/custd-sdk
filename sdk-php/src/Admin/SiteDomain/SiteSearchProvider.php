<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteSearchProvider is a search engine Custd imports a domain's search numbers from. */
enum SiteSearchProvider: string
{
    /** Google Search Console, read through Custd's service account added as a user on the property. */
    case Google = 'google';
    /** Bing Webmaster Tools, read with the client's own API key. */
    case Bing = 'bing';
}
