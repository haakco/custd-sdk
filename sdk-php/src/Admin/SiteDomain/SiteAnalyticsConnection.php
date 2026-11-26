<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteAnalyticsConnection is a domain's GA4 property connection and its import state. A new
 * connection is pending until its first import.
 */
final readonly class SiteAnalyticsConnection
{
    /**
     * @param SiteAnalyticsProvider::* $provider
     * @param SiteSearchConnectionStatus::* $status
     */
    public function __construct(
        public string $provider,
        public string $propertyId,
        public string $status,
        public ?string $lastImportedAt = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'provider'),
            Fields::string($payload, 'propertyId'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'lastImportedAt'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
