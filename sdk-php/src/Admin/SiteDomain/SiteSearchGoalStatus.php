<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteSearchGoalStatus names the values of SiteSearchValue.goalStatus.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteSearchGoalStatus
{
    public const MEASURED = 'measured';
    public const PARTIAL = 'partial';
    public const UNAVAILABLE = 'unavailable';
}
