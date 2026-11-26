<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseFramingMode is who may frame the routes a header rule matches. */
enum AppReleaseFramingMode: string
{
    case Deny = 'deny';
    case SameOrigin = 'same-origin';
    case Any = 'any';
}
