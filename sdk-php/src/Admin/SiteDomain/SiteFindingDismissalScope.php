<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteFindingDismissalScope says whether a dismissal hides a rule everywhere or only on one page. */
final class SiteFindingDismissalScope
{
    public const RULE = 'rule';
    public const URL = 'url';
}
