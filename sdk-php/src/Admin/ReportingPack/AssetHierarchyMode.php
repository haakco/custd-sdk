<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

/**
 * AssetHierarchyMode names the values of AssetHierarchyEdge.mode.
 * A value Custd adds later still decodes as a plain string.
 */
final class AssetHierarchyMode
{
    public const INCLUSIVE = 'inclusive';
    public const EXCLUSIVE = 'exclusive';
    public const INFORMATIONAL = 'informational';
}
