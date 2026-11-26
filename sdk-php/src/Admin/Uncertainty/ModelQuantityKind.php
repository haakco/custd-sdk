<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

/**
 * ModelQuantityKind names the values of Quantity.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class ModelQuantityKind
{
    public const INPUT = 'input';
    public const FORMULA = 'formula';
}
