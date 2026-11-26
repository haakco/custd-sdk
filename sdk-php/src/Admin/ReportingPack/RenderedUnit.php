<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * RenderedUnit names the values of NumericSelector.unit, RenderedMetricValue.unit.
 * A value Custd adds later still decodes as a plain string.
 */
final class RenderedUnit
{
    public const CURRENCY_PER_UNIT = 'currency_per_unit';
    public const COUNT = 'count';
    public const MILLISECONDS = 'milliseconds';
    public const BYTES = 'bytes';
    public const PERCENT = 'percent';
    public const CURRENCY = 'currency';
    public const W = 'W';
    public const KW = 'kW';
    public const WH = 'Wh';
    public const KWH = 'kWh';
    public const V = 'V';
    public const A = 'A';
    public const L = 'L';
    public const CEL = 'Cel';
    public const L_PER_S = 'L/s';
    public const SCORE = 'score';
}
