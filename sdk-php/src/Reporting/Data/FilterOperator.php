<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * FilterOperator names the values of FilterDefinition.operators, RequestedFilter.operator.
 * A value Custd adds later still decodes as a plain string.
 */
final class FilterOperator
{
    public const EQ = 'eq';
    public const NEQ = 'neq';
    public const IN = 'in';
    public const CONTAINS = 'contains';
}
