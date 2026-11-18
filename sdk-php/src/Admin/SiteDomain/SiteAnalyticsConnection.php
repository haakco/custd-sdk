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
    public const PROVIDER_GA4 = 'ga4';

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_FAILING = 'failing';
    public const STATUS_REVOKED = 'revoked';

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
