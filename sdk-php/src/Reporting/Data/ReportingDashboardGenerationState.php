<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportingDashboardGenerationState names the values of DashboardGenerationResponse.state.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportingDashboardGenerationState
{
    public const BUILDING = 'building';
    public const READY = 'ready';
    public const UNAVAILABLE = 'unavailable';
}
