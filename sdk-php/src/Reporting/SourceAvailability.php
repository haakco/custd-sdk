<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

/**
 * SourceAvailability names the values of ReconciliationResult.availability, SourceContribution.availability.
 * A value Custd adds later still decodes as a plain string.
 */
final class SourceAvailability
{
    public const AVAILABLE = 'available';
    public const UNAVAILABLE = 'unavailable';
}
