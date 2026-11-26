<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDirectoryAction names what actOnDirectory does to one directory credential store.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDirectoryAction
{
    public const ENABLE = 'enable';
    public const PAUSE = 'pause';
    public const RESUME = 'resume';
    public const RELEASE = 'release';
}
