<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ExecutiveComparisonBasis names the values of ExecutiveComparisonResult.basis,
 * ExecutiveReportDefinition.comparisonBasis.
 * A value Custd adds later still decodes as a plain string.
 */
final class ExecutiveComparisonBasis
{
    public const NONE = 'none';
    public const PREVIOUS_PERIOD = 'previous-period';
    public const TARGET = 'target';
}
