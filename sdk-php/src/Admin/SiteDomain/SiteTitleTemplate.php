<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTitleTemplate names the values of SiteTitleOption.template.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteTitleTemplate
{
    public const GENERAL = 'general';
    public const GUIDE = 'guide';
}
