<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * AuthProjectDomainImageSource names the values of AuthDomainImages.source.
 * A value Custd adds later still decodes as a plain string.
 */
final class AuthProjectDomainImageSource
{
    public const RELEASE_DEFAULT = 'release-default';
    public const OVERRIDE = 'override';
    public const UNDECLARED = 'undeclared';
}
