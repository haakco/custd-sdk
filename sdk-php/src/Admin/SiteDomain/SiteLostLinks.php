<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteLostLinks is the referring domains previousRelease listed that release no longer has. status is
 * a SiteLinkSourceTotal::STATUS_AVAILABLE, STATUS_PENDING or STATUS_UNAVAILABLE value.
 */
final readonly class SiteLostLinks
{
    /**
     * @param list<SiteLostReferringDomain> $domains
     * @param SiteLostLinksStatus::* $status
     */
    public function __construct(
        public string $status,
        public string $scope,
        public array $domains,
        public ?string $release = null,
        public ?string $previousRelease = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'status'),
            Fields::string($payload, 'scope'),
            array_map(SiteLostReferringDomain::fromPayload(...), Fields::objects($payload, 'domains')),
            Fields::optionalString($payload, 'release'),
            Fields::optionalString($payload, 'previousRelease'),
        );
    }
}
