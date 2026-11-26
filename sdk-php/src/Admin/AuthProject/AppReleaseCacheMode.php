<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseCacheMode is the caching a cache rule applies to the files it matches. */
final class AppReleaseCacheMode
{
    public const IMMUTABLE = 'immutable';
    public const REVALIDATE = 'revalidate';
    public const SHORT = 'short';
    public const NO_STORE = 'no-store';
}
