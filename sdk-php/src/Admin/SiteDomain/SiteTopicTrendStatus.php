<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteTopicTrendStatus names the values of SiteTopicTrend.status.
 * A value Custd adds later still decodes as a plain string.
 */
final class SiteTopicTrendStatus
{
    public const PENDING = 'pending';
    public const FOUND = 'found';
    public const NO_ARTICLE = 'no_article';
    public const FAILED = 'failed';
}
