<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataScope;

/**
 * DataScopePrincipalKind names the values of PrincipalRef.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataScopePrincipalKind
{
    public const HUMAN = 'human';
    public const MACHINE = 'machine';
}
