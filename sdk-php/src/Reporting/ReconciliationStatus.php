<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

/**
 * ReconciliationStatus names the values of ReconciliationResult.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReconciliationStatus
{
    public const AVAILABLE = 'available';
    public const STALE = 'stale';
    public const UNAVAILABLE = 'unavailable';
}
