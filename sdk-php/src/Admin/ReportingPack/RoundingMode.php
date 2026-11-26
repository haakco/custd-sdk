<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * RoundingMode names the values of RoundingPolicy.mode.
 * A value Custd adds later still decodes as a plain string.
 */
final class RoundingMode
{
    public const HALF_UP = 'half_up';
    public const HALF_EVEN = 'half_even';
    public const DOWN = 'down';
    public const UP = 'up';
}
