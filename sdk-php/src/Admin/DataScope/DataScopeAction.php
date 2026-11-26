<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * DataScopeAction names the values of Grant.action.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataScopeAction
{
    public const READ = 'read';
    public const WRITE = 'write';
}
