<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * PreparedDataAvailability names the values of OutputStatus.availability, ReceiptStatus.availability.
 * A value Custd adds later still decodes as a plain string.
 */
final class PreparedDataAvailability
{
    public const COMPLETE = 'complete';
    public const PARTIAL = 'partial';
    public const STALE = 'stale';
    public const UNAVAILABLE = 'unavailable';
}
