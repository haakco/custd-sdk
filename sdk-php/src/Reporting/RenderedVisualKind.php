<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

/**
 * RenderedVisualKind names the values of RenderedVisualResult.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class RenderedVisualKind
{
    public const LIFECYCLE = 'lifecycle';
    public const COHORT = 'cohort';
    public const DISTRIBUTION = 'distribution';
    public const UNCERTAINTY = 'uncertainty';
    public const ANOMALY_DRIVER = 'anomaly_driver';
}
