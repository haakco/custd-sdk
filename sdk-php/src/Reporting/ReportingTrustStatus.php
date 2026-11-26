<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

/**
 * ReportingTrustStatus names the values of ExecutiveConfidence.status, ReportingTrust.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportingTrustStatus
{
    public const HEALTHY = 'healthy';
    public const PARTIAL = 'partial';
    public const UNAVAILABLE = 'unavailable';
    public const UNKNOWN = 'unknown';
}
