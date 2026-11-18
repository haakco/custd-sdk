<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** SiteInsightsTasks is the state of every Site Insights scheduled task, for a system administrator. */
final readonly class SiteInsightsTasks
{
    /** @param list<SiteInsightsTaskStatus> $tasks */
    public function __construct(
        public string $generatedAt,
        public array $tasks,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'generatedAt'),
            array_map(SiteInsightsTaskStatus::fromPayload(...), Fields::objects($payload, 'tasks')),
        );
    }
}
