<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseState is a release's lifecycle: pending accepts uploads, verified can be promoted. */
final class AppReleaseState
{
    public const PENDING = 'pending';
    public const VERIFIED = 'verified';
}
