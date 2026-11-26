<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

use HaakCo\Custd\Fields;

final readonly class OAuthClientAdmission
{
    /**
     * @param list<OAuthClientAdmissionGrant> $approvedGrants
     * @param list<OAuthClientAdmissionGrant> $requestedGrants
     */
    public function __construct(
        public string $admissionUuid,
        public array $approvedGrants,
        public string $clientId,
        public string $companyUuid,
        public array $requestedGrants,
        public string $requestedSecurityRevision,
        public int $revision,
        public ?string $approvedAt = null,
        public ?string $approvedSecurityRevision = null,
        public ?string $revokedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'admissionUuid'),
            array_map(OAuthClientAdmissionGrant::fromPayload(...), Fields::objects($payload, 'approvedGrants')),
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'companyUuid'),
            array_map(OAuthClientAdmissionGrant::fromPayload(...), Fields::objects($payload, 'requestedGrants')),
            Fields::string($payload, 'requestedSecurityRevision'),
            Fields::integer($payload, 'revision'),
            Fields::optionalString($payload, 'approvedAt'),
            Fields::optionalString($payload, 'approvedSecurityRevision'),
            Fields::optionalString($payload, 'revokedAt'),
        );
    }
}
