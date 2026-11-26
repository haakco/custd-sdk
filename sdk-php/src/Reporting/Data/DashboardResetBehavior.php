<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

/**
 * DashboardResetBehavior names the values of DashboardInteractionRule.resetBehavior.
 * A value Custd adds later still decodes as a plain string.
 */
final class DashboardResetBehavior
{
    public const INTERACTION = 'interaction';
    public const DASHBOARD = 'dashboard';
}
