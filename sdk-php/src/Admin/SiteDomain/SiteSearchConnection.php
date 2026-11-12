<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteSearchConnection is one provider connection and its import state. importedThrough is the
 * last imported date (YYYY-MM-DD); the API key of a Bing connection is never returned.
 */
final readonly class SiteSearchConnection
{
    public function __construct(
        public SiteSearchProvider $provider,
        public string $property,
        public SiteSearchConnectionStatus $status,
        public ?string $importedThrough = null,
        public ?string $lastImportedAt = null,
        public ?string $lastFailure = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            SiteSearchProvider::from(Fields::string($payload, 'provider')),
            Fields::string($payload, 'property'),
            SiteSearchConnectionStatus::from(Fields::string($payload, 'status')),
            Fields::optionalString($payload, 'importedThrough'),
            Fields::optionalString($payload, 'lastImportedAt'),
            Fields::optionalString($payload, 'lastFailure'),
        );
    }
}
