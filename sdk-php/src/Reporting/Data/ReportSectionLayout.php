<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportSectionLayout names the values of ReportSectionDefinition.layout.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportSectionLayout
{
    public const LEAD = 'lead';
    public const GRID = 'grid';
    public const DETAIL = 'detail';
}
