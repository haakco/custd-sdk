<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteRemedyKind names the values of SiteRemedy.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteRemedyKind
{
    public const MARKUP = 'markup';
    public const SETTING = 'setting';
    public const CONTENT = 'content';
    public const SERVER = 'server';
}
