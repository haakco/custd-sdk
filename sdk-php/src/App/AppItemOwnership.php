<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppItemOwnership names the values of AppItem.ownership, AppItemSummary.ownership.
 * Whether the signed-in caller owns it.
 * A value Custd adds later still decodes as a plain string.
 */
final class AppItemOwnership
{
    public const UNOWNED = 'unowned';
    public const YOURS = 'yours';
    public const OTHER = 'other';
}
