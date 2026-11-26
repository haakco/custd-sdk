<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * ReportingSnapshotColumnType names the values of SnapshotColumn.type.
 * A value Custd adds later still decodes as a plain string.
 */
final class ReportingSnapshotColumnType
{
    public const TEXT = 'text';
    public const INTEGER = 'integer';
    public const NUMBER = 'number';
    public const PERCENTAGE = 'percentage';
    public const CURRENCY = 'currency';
    public const DATE = 'date';
    public const DATETIME = 'datetime';
    public const DURATION = 'duration';
    public const BOOLEAN = 'boolean';
    public const NULL = 'null';
}
