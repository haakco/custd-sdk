<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/** RedactedProvisionedProducer is a provisioned producer bundle without its client secret, safe to display. */
final readonly class RedactedProvisionedProducer
{
    /**
     * @param list<string> $scopes
     * @param list<string> $allowedEnvironments
     */
    public function __construct(
        public string $baseUrl,
        public string $tokenUrl,
        public string $audience,
        public string $companySlug,
        public string $producerSlug,
        public string $clientId,
        public array $scopes,
        public array $allowedEnvironments,
        public ?string $environment = null,
    ) {
    }

    public static function fromProducer(ProvisionedProducer $producer): self
    {
        return new self(
            $producer->baseUrl,
            $producer->tokenUrl,
            $producer->audience,
            $producer->companySlug,
            $producer->producerSlug,
            $producer->clientId,
            $producer->scopes,
            $producer->allowedEnvironments,
            $producer->environment,
        );
    }
}
