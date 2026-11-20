<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** Provider-observed authentication hostname and DNS instructions for one environment. */
final readonly class AuthDomainBinding
{
    public const ACTIVE = "active";

    public function __construct(
        public string $environmentId,
        public string $hostname,
        public string $issuer,
        public string $status,
        public AuthDomainDnsProof $dnsProof,
        public string $createdAt,
        public ?string $siteDomainId = null,
        public ?string $dnsTarget = null,
        public ?string $observedAt = null,
        public ?string $certificateExpiresAt = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, "authentication domain binding");

        return new self(
            Fields::string($object, "environmentId"),
            Fields::string($object, "host"),
            Fields::string($object, "issuer"),
            Fields::string($object, "status"),
            AuthDomainDnsProof::fromPayload(Fields::object($object, "dnsProof")),
            Fields::string($object, "createdAt"),
            Fields::optionalString($object, "siteDomainId"),
            Fields::optionalString($object, "dnsTarget"),
            Fields::optionalString($object, "observedAt"),
            Fields::optionalString($object, "certificateExpiresAt"),
        );
    }
}
