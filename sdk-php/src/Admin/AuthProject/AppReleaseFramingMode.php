<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseFramingMode is who may frame the routes a header rule matches. */
final class AppReleaseFramingMode
{
    public const DENY = 'deny';
    public const SAME_ORIGIN = 'same-origin';
    public const ANY = 'any';
}
