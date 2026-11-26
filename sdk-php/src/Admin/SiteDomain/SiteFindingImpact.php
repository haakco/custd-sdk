<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteFindingImpact compares the search numbers of a finding's page in the windowDays before and after
 * an audit first saw it fixed. status is a SiteFindingImpactStatus value; fixedAt, before and after are null while it
 * is open. note says why the difference is an observation, not a measured effect.
 */
final readonly class SiteFindingImpact
{
    /** The window the server uses when none is asked for. */
    public const DEFAULT_DAYS = 28;
    public const MIN_DAYS = 7;
    public const MAX_DAYS = 90;

    /**
     * @param list<SiteFindingImpactSource> $sources
     * @param SiteFindingImpactStatus::* $status
     */
    public function __construct(
        public string $findingUuid,
        public string $rule,
        public string $url,
        public string $pageUrl,
        public string $status,
        public int $windowDays,
        public array $sources,
        public string $note,
        public ?string $fixedAt = null,
        public ?SiteSearchImpactWindow $before = null,
        public ?SiteSearchImpactWindow $after = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $before = Fields::optionalObject($payload, 'before');
        $after = Fields::optionalObject($payload, 'after');

        return new self(
            Fields::string($payload, 'findingUuid'),
            Fields::string($payload, 'rule'),
            Fields::string($payload, 'url'),
            Fields::string($payload, 'pageUrl'),
            Fields::string($payload, 'status'),
            Fields::integer($payload, 'windowDays'),
            array_map(SiteFindingImpactSource::fromPayload(...), Fields::objects($payload, 'sources')),
            Fields::string($payload, 'note'),
            Fields::optionalString($payload, 'fixedAt'),
            $before === null ? null : SiteSearchImpactWindow::fromPayload($before),
            $after === null ? null : SiteSearchImpactWindow::fromPayload($after),
        );
    }
}
