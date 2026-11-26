<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SitePageLinkPlacement names the values of SiteLinkSource.where.
 * A value Custd adds later still decodes as a plain string.
 */
final class SitePageLinkPlacement
{
    public const TITLE = 'title';
    public const HEADING = 'heading';
}
