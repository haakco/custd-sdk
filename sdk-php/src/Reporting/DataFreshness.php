<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

/**
 * DataFreshness names the values of ReportingTrust.dataFreshness.
 * A value Custd adds later still decodes as a plain string.
 */
final class DataFreshness
{
    public const UNKNOWN = 'unknown';
    public const CURRENT = 'current';
    public const FRESH = 'fresh';
    public const STALE = 'stale';
    public const UNAVAILABLE = 'unavailable';
}
