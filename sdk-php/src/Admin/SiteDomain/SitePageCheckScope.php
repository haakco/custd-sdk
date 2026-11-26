<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SitePageCheckScope names the values of SitePageCheckRequest.scope, SitePageCheckResponse.scope.
 * The draft's scope; a recheck leaves it empty.
 * A value Custd adds later still decodes as a plain string.
 */
final class SitePageCheckScope
{
    public const PAGE = 'page';
    public const CONTENT = 'content';
}
