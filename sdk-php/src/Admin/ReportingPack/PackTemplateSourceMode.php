<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * PackTemplateSourceMode names the values of PackTemplate.sourceModes.
 * A value Custd adds later still decodes as a plain string.
 */
final class PackTemplateSourceMode
{
    public const AUTO = 'auto';
    public const POSTGRES = 'postgres';
    public const DUCKDB = 'duckdb';
}
