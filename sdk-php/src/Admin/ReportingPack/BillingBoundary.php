<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * BillingBoundary names the values of SteppedRateSchedule.billingBoundary.
 * A value Custd adds later still decodes as a plain string.
 */
final class BillingBoundary
{
    public const CALENDAR_MONTH = 'calendar_month';
    public const CALENDAR_DAY = 'calendar_day';
}
