<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ApplicationProfileFieldEditor names the values of ApplicationProfileField.editableBy, ProfileField.editableBy.
 * A value Custd adds later still decodes as a plain string.
 */
final class ApplicationProfileFieldEditor
{
    public const USER = 'user';
    public const PROVIDER = 'provider';
    public const ADMINISTRATOR = 'administrator';
}
