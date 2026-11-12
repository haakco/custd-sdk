<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteDomainVerification tells the tenant how to prove control of a host:
 * publish either the DNS TXT record or the well-known file. Either is enough.
 */
final readonly class SiteDomainVerification
{
    public function __construct(
        public string $dnsRecordName,
        public string $dnsRecordValue,
        public string $fileUrl,
        public string $fileContent,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'dnsRecordName'),
            Fields::string($payload, 'dnsRecordValue'),
            Fields::string($payload, 'fileUrl'),
            Fields::string($payload, 'fileContent'),
        );
    }
}
