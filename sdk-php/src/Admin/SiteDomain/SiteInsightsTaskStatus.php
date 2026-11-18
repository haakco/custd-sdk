<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteInsightsTaskStatus is one Site Insights scheduled task: registered is false when this
 * deployment's scheduler never registered it, the run times are null before a run, and
 * lastFailureAt is the start of the newest failed recent run.
 */
final readonly class SiteInsightsTaskStatus
{
    public const TASK_SITE_CHECKS = 'site-checks';
    public const TASK_SITE_AUDITS = 'site-audits';
    public const TASK_SITE_SEARCH_IMPORTS = 'site-search-imports';
    public const TASK_SITE_WEB_DATA = 'site-web-data';
    public const TASK_SITE_WEB_GRAPH = 'site-web-graph';
    public const TASK_SITE_ACCESS_LOGS = 'site-access-logs';
    public const TASK_SITE_SEARCH_POOL = 'site-search-pool';

    /** @param list<SiteInsightsBacklog> $backlog */
    public function __construct(
        public string $taskName,
        public bool $registered,
        public bool $enabled,
        public array $backlog,
        public ?string $nextRunAt = null,
        public ?string $lastRunAt = null,
        public ?string $lastRunStatus = null,
        public ?string $lastFailureAt = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'taskName'),
            Fields::boolean($payload, 'registered'),
            Fields::boolean($payload, 'enabled'),
            array_map(SiteInsightsBacklog::fromPayload(...), Fields::objects($payload, 'backlog')),
            Fields::optionalString($payload, 'nextRunAt'),
            Fields::optionalString($payload, 'lastRunAt'),
            Fields::optionalString($payload, 'lastRunStatus'),
            Fields::optionalString($payload, 'lastFailureAt'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
