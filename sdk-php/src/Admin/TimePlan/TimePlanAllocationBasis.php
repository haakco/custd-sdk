<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

/**
 * TimePlanAllocationBasis names the values of DefinitionBlock.basis.
 * A value Custd adds later still decodes as a plain string.
 */
final class TimePlanAllocationBasis
{
    public const ABSOLUTE = 'absolute';
    public const HORIZON_FRACTION = 'horizon_fraction';
    public const REMAINDER_WEIGHT = 'remainder_weight';
}
