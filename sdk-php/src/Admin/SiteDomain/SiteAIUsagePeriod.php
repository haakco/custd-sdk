<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

enum SiteAIUsagePeriod: string
{
    case Day = 'day';
    case Month = 'month';
    case PreviousMonth = 'previous-month';
}
