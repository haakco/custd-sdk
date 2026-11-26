<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

/**
 * PresentationLayerYKind names the values of PresentationLayer.yKind.
 * A value Custd adds later still decodes as a plain string.
 */
final class PresentationLayerYKind
{
    public const NUMERIC = 'numeric';
    public const TEMPORAL = 'temporal';
}
