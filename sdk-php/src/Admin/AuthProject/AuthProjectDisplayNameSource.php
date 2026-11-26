<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDisplayNameSource names the values of DesiredState.displayNameSource.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDisplayNameSource
{
    public const APPLICATION = 'application';
    public const HOSTING = 'hosting';
}
