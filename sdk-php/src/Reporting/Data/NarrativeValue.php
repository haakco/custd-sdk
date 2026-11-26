<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * NarrativeValue names the values of NarrativeValueReference.value.
 * A value Custd adds later still decodes as a plain string.
 */
final class NarrativeValue
{
    public const PRIMARY = 'primary';
    public const DELTA = 'delta';
}
