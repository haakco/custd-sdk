<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelListSource names which uncertainty models a list returns: all, the admin-made ones or the app-made ones.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelListSource
{
    public const ALL = 'all';
    public const ADMIN = 'admin';
    public const APP = 'app';
}
