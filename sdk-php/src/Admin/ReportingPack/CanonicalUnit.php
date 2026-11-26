<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * CanonicalUnit names the values of AccountingEvidence.unit, AccountingEvidenceCreateRequest.unit,
 * PackMetric.canonicalUnit, ReconciliationResult.unit, SemanticSeries.allowedSourceUnits,
 * SemanticSeries.canonicalUnit, SourceContribution.unit, SourceReconciliation.canonicalUnit,
 * SteppedRateSchedule.usageUnit.
 * A value Custd adds later still decodes as a plain string.
 */
final class CanonicalUnit
{
    public const W = 'W';
    public const KW = 'kW';
    public const WH = 'Wh';
    public const KWH = 'kWh';
    public const V = 'V';
    public const A = 'A';
    public const L = 'L';
    public const CEL = 'Cel';
    public const BY = 'By';
    public const DIMENSIONLESS = '1';
}
