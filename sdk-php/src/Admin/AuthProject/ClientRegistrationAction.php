<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/**
 * ClientRegistrationAction names the values of ClientRegistration.action.
 * A value Custd adds later still decodes as a plain string.
 */
final class ClientRegistrationAction
{
    public const CREATED = 'created';
    public const UPDATED = 'updated';
    public const UNCHANGED = 'unchanged';
    public const REMOVED = 'removed';
    public const REFUSED = 'refused';
}
