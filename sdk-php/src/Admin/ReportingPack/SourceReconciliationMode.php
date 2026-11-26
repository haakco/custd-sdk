<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * SourceReconciliationMode names the values of SourceReconciliation.mode.
 * A value Custd adds later still decodes as a plain string.
 */
final class SourceReconciliationMode
{
    public const PRIORITY = 'priority';
    public const FRESHNESS = 'freshness';
    public const AVAILABILITY = 'availability';
    public const AGREEMENT = 'agreement';
}
