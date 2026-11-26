<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportingComparisonPreset names the values of DashboardInteractionRule.comparisonPreset,
 * DashboardSharePolicy.comparisonPresets, ExportQueryParameters.comparison, QueryRequest.comparison.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportingComparisonPreset
{
    public const PREVIOUS_PERIOD = 'previous_period';
    public const PREVIOUS_YEAR = 'previous_year';
}
