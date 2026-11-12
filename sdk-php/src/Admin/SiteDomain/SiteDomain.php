<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteDomain is a host a site has claimed, whether its tenant has proven
 * control, and its latest audit. Only a verified domain is audited.
 */
final readonly class SiteDomain
{
    public function __construct(
        public string $domainUuid,
        public string $siteUuid,
        public string $host,
        public SiteDomainOwnership $ownership,
        public SiteDomainAudit $audit,
        public string $createdAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domainUuid'),
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'host'),
            SiteDomainOwnership::fromPayload(Fields::object($payload, 'ownership')),
            SiteDomainAudit::fromPayload(Fields::object($payload, 'audit')),
            Fields::string($payload, 'createdAt'),
        );
    }
}
