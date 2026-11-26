<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseState is a release's lifecycle: pending accepts uploads, verified can be promoted. */
enum AppReleaseState: string
{
    case Pending = 'pending';
    case Verified = 'verified';
}
