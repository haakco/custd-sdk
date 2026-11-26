<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteIndexNowSubmissionStatus is where an IndexNow submission is. Accepted means IndexNow
 * received the URLs, not that a search engine indexed them.
 */
final class SiteIndexNowSubmissionStatus
{
    public const QUEUED = 'queued';
    public const ACCEPTED = 'accepted';
    public const REJECTED = 'rejected';
    public const FAILED = 'failed';
}
