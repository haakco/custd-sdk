<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAuditPage is one URL the latest audit crawled. status is the first response's HTTP status,
 * 0 when the request failed. depth and inboundLinks are null when not known (a truncated crawl
 * leaves them out); a present 0 is a real 0. indexability is a SiteAuditPageIndexability value.
 */
final readonly class SiteAuditPage
{
    /**
     * @param SiteAuditPageIndexability::* $indexability
     */
    public function __construct(
        public string $url,
        public int $status,
        public string $indexability,
        public int $openFindings,
        public ?string $finalUrl = null,
        public ?int $depth = null,
        public ?int $inboundLinks = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'url'),
            Fields::integer($payload, 'status'),
            Fields::string($payload, 'indexability'),
            Fields::integer($payload, 'openFindings'),
            Fields::optionalString($payload, 'finalUrl'),
            Fields::optionalInteger($payload, 'depth'),
            Fields::optionalInteger($payload, 'inboundLinks'),
        );
    }
}
