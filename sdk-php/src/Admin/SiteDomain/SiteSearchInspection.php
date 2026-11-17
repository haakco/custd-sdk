<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchInspection is one Google Search Console URL Inspection and, once done, what Google
 * answered. Every result field is Google's own value and is null when Google did not report it;
 * lastCrawlAt is null when Google never crawled the URL.
 */
final readonly class SiteSearchInspection
{
    public function __construct(
        public string $inspectionUuid,
        public string $url,
        public SiteSearchInspectionStatus $status,
        public string $requestedAt,
        public ?string $inspectedAt = null,
        public ?string $failure = null,
        public ?string $verdict = null,
        public ?string $coverageState = null,
        public ?string $indexingState = null,
        public ?string $robotsTxtState = null,
        public ?string $pageFetchState = null,
        public ?string $lastCrawlAt = null,
        public ?string $googleCanonical = null,
        public ?string $userCanonical = null,
        public ?string $crawledAs = null,
        public ?string $mobileUsabilityVerdict = null,
        public ?string $resultLink = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'inspectionUuid'),
            Fields::string($payload, 'url'),
            SiteSearchInspectionStatus::from(Fields::string($payload, 'status')),
            Fields::string($payload, 'requestedAt'),
            Fields::optionalString($payload, 'inspectedAt'),
            Fields::optionalString($payload, 'failure'),
            Fields::optionalString($payload, 'verdict'),
            Fields::optionalString($payload, 'coverageState'),
            Fields::optionalString($payload, 'indexingState'),
            Fields::optionalString($payload, 'robotsTxtState'),
            Fields::optionalString($payload, 'pageFetchState'),
            Fields::optionalString($payload, 'lastCrawlAt'),
            Fields::optionalString($payload, 'googleCanonical'),
            Fields::optionalString($payload, 'userCanonical'),
            Fields::optionalString($payload, 'crawledAs'),
            Fields::optionalString($payload, 'mobileUsabilityVerdict'),
            Fields::optionalString($payload, 'resultLink'),
        );
    }
}
