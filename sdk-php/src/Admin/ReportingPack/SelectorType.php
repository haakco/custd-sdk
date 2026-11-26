<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * SelectorType names the values of NumericSelector.type, SelectorDefinition.type.
 * A value Custd adds later still decodes as a plain string.
 */
final class SelectorType
{
    public const STRING = 'string';
    public const INTEGER = 'integer';
    public const NUMBER = 'number';
}
