<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\OAuth;

final readonly class OAuthClientAdmissionApproveRequest
{
    /**
     * @param list<OAuthClientAdmissionGrant> $grants
     */
    public function __construct(
        public string $clientId,
        public string $companySlug,
        public int $expectedRevision,
        public array $grants,
        public string $securityRevision,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'clientId' => $this->clientId,
            'companySlug' => $this->companySlug,
            'expectedRevision' => $this->expectedRevision,
            'grants' => array_map(static fn (OAuthClientAdmissionGrant $item): array => $item->serialise(), $this->grants),
            'securityRevision' => $this->securityRevision,
        ];

        return $body;
    }
}
