<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SitePortfolioDomain is one domain's status and first action, as its next-actions read gives
 * them, and its open findings by severity. firstAction is null when there is nothing to do.
 */
final readonly class SitePortfolioDomain
{
    /**
     * @param SiteUptimeStatus::* $status
     */
    public function __construct(
        public string $domainUuid,
        public string $siteUuid,
        public string $host,
        public string $status,
        public string $headline,
        public int $actionCount,
        public SiteFindingCounts $openFindings,
        public ?string $checkedAt = null,
        public ?SiteNextAction $firstAction = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $first = Fields::optionalObject($payload, 'firstAction');

        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'host'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'headline'),
            Fields::integer($payload, 'actionCount'),
            SiteFindingCounts::fromPayload(Fields::object($payload, 'openFindings')),
            Fields::optionalString($payload, 'checkedAt'),
            $first === null ? null : SiteNextAction::fromPayload($first),
        );
    }
}
