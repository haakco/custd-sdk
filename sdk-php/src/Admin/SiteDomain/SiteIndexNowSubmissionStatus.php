<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

/**
 * SiteIndexNowSubmissionStatus is where an IndexNow submission is. Accepted means IndexNow
 * received the URLs, not that a search engine indexed them.
 */
enum SiteIndexNowSubmissionStatus: string
{
    case Queued = 'queued';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Failed = 'failed';
}
