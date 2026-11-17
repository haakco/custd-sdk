<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAuditPage is one URL the latest audit crawled. status is the first response's HTTP status,
 * 0 when the request failed. depth and inboundLinks are null when not known (a truncated crawl
 * leaves them out); a present 0 is a real 0. indexability is one of the INDEXABILITY_* values.
 */
final readonly class SiteAuditPage
{
    public const INDEXABILITY_INDEXABLE = 'indexable';
    public const INDEXABILITY_NOINDEX = 'noindex';
    public const INDEXABILITY_CANONICALIZED = 'canonicalized';
    public const INDEXABILITY_REDIRECTED = 'redirected';
    public const INDEXABILITY_ERROR = 'error';
    public const INDEXABILITY_NOT_HTML = 'not_html';

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
