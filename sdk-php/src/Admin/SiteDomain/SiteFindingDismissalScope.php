<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/** SiteFindingDismissalScope says whether a dismissal hides a rule everywhere or only on one page. */
enum SiteFindingDismissalScope: string
{
    case Rule = 'rule';
    case Url = 'url';
}
