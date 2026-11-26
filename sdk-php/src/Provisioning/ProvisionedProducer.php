<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/**
 * ProvisionedProducer is a newly minted producer credential. clientSecret is shown once: store it in
 * the caller's secret owner before doing anything else.
 */
final readonly class ProvisionedProducer
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
        public string $clientSecret,
        public array $scopes,
        public array $allowedEnvironments,
        public ?string $environment = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'baseUrl'),
            Fields::string($payload, 'tokenUrl'),
            Fields::string($payload, 'audience'),
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'producerSlug'),
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'clientSecret'),
            Fields::strings($payload, 'scopes'),
            Fields::strings($payload, 'allowedEnvironments'),
            Fields::optionalString($payload, 'environment'),
        );
    }
}
