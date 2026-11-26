<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseCacheMode is the caching a cache rule applies to the files it matches. */
enum AppReleaseCacheMode: string
{
    case Immutable = 'immutable';
    case Revalidate = 'revalidate';
    case Short = 'short';
    case NoStore = 'no-store';
}
