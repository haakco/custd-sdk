<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * Provider-observed authentication hostname and DNS instructions for one
 * environment, plus the realm admission it holds.
 *
 * `slotRef` is the stored claim and `intentRevision` the domain intent revision
 * that claim was written at, so a remediation compares the revision rather than
 * the presentation revision. `lifecycle` reports what an operator may act on;
 * `images` reports what the realm runs against what it should run. Each is null
 * when an older Custd does not publish it, so a read never fails on absence.
 * `dnsProof` is null for a platform-generated hostname, which needs no DNS record.
 */
final readonly class AuthDomainBinding
{
    /**
     * @param AuthProjectDomainLifecycle::*|null $lifecycle
     * @param AuthProjectDomainStatus::* $status
     */
    public function __construct(
        public string $environmentId,
        public string $hostname,
        public string $issuer,
        public string $status,
        public ?AuthDomainDnsProof $dnsProof,
        public string $createdAt,
        public ?string $siteDomainId = null,
        public ?string $dnsTarget = null,
        public ?string $observedAt = null,
        public ?string $certificateExpiresAt = null,
        public ?string $slotRef = null,
        public ?string $lifecycle = null,
        public ?int $intentRevision = null,
        public ?AuthDomainImages $images = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, "authentication domain binding");
        $images = Fields::optionalObject($object, "images");
        $dnsProof = Fields::optionalObject($object, "dnsProof");

        return new self(
            Fields::string($object, "environmentId"),
            Fields::string($object, "host"),
            Fields::string($object, "issuer"),
            Fields::string($object, "status"),
            $dnsProof === null ? null : AuthDomainDnsProof::fromPayload($dnsProof),
            Fields::string($object, "createdAt"),
            Fields::optionalString($object, "siteDomainId"),
            Fields::optionalString($object, "dnsTarget"),
            Fields::optionalString($object, "observedAt"),
            Fields::optionalString($object, "certificateExpiresAt"),
            Fields::optionalString($object, "slotRef"),
            Fields::optionalString($object, "lifecycle"),
            Fields::optionalInteger($object, "intentRevision"),
            $images === null ? null : AuthDomainImages::fromPayload($images),
        );
    }
}
