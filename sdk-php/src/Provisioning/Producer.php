<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** Producer is the public view of a provisioned producer credential: never its secret. */
final readonly class Producer
{
    /**
     * @param list<string> $scopes
     * @param list<string> $allowedEnvironments
     */
    public function __construct(
        public string $clientId,
        public string $companySlug,
        public string $producerSlug,
        public array $scopes,
        public array $allowedEnvironments,
        public ?string $displayName = null,
        public ?string $environment = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'producerSlug'),
            Fields::strings($payload, 'scopes'),
            Fields::strings($payload, 'allowedEnvironments'),
            Fields::optionalString($payload, 'displayName'),
            Fields::optionalString($payload, 'environment'),
        );
    }
}
