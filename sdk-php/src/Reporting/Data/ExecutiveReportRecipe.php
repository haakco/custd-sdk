<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ExecutiveReportRecipe names the values of ExecutiveReport.recipe, ExecutiveReportDefinition.recipe.
 * A value Custd adds later still decodes as a plain string.
 */
final class ExecutiveReportRecipe
{
    public const BLANK = 'blank';
    public const WEEKLY_PERFORMANCE = 'weekly-performance';
    public const OPERATIONS_HEALTH = 'operations-health';
    public const FORECAST_DECISION = 'forecast-decision';
}
