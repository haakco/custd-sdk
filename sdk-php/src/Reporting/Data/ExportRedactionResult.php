<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ExportRedactionResult names the values of CompletedRunExportRedaction.result.
 * A value Custd adds later still decodes as a plain string.
 */
final class ExportRedactionResult
{
    public const NOT_REQUIRED = 'not_required';
    public const APPLIED = 'applied';
}
