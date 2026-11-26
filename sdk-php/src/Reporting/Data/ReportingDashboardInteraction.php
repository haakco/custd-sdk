<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportingDashboardInteraction names the values of DashboardCatalogueEntry.interactions,
 * DashboardInteractionRule.action.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportingDashboardInteraction
{
    public const FILTER = 'filter';
    public const DRILL_DOWN = 'drill_down';
}
