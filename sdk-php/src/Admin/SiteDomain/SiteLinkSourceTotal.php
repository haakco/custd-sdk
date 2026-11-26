<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteLinkSourceTotal is what one link source (a SOURCE_* value) knows about a domain. status is a
 * STATUS_* value; scope says what the counts cover. referringDomains and links are null when the
 * source has not counted them (never 0), and complete says whether every referring domain is listed.
 */
final readonly class SiteLinkSourceTotal
{
    public const SOURCE_BING = 'bing';
    public const SOURCE_COMMONCRAWL = 'commoncrawl';
    public const SOURCE_CRAWL = 'crawl';
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_PENDING = 'pending';
    public const STATUS_FAILED = 'failed';
    public const STATUS_UNAVAILABLE = 'unavailable';

    /**
     * @param SiteLinkSource::* $source
     * @param SiteLinkSourceStatus::* $status
     */
    public function __construct(
        public string $source,
        public string $status,
        public string $scope,
        public int $listed,
        public bool $complete,
        public ?string $asOf = null,
        public ?int $referringDomains = null,
        public ?int $links = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'source'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'scope'),
            Fields::integer($payload, 'listed'),
            Fields::boolean($payload, 'complete'),
            Fields::optionalString($payload, 'asOf'),
            Fields::optionalInteger($payload, 'referringDomains'),
            Fields::optionalInteger($payload, 'links'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
