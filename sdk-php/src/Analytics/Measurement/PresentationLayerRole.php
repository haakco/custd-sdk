<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

/**
 * PresentationLayerRole names the values of PresentationLayer.role.
 * A value Custd adds later still decodes as a plain string.
 */
final class PresentationLayerRole
{
    public const OBSERVED_PROGRESS = 'observed_progress';
    public const PREVIOUS_SNAPSHOTS = 'previous_snapshots';
    public const OUTER_INTERVAL = 'outer_interval';
    public const INNER_INTERVAL = 'inner_interval';
    public const MEDIAN = 'median';
}
