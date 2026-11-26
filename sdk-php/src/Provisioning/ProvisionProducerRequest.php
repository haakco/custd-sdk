<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/**
 * ProvisionProducerRequest mints a producer credential in a tenant. scopeTemplate is one of the
 * Client::SCOPE_TEMPLATE_* names; explicit scopes are only for templates that take them. Empty
 * optional fields are left out, so Custd applies its defaults.
 */
final readonly class ProvisionProducerRequest
{
    /**
     * @param list<string> $allowedEnvironments
     * @param list<string> $scopes
     */
    public function __construct(
        public string $companySlug,
        public string $producerSlug,
        public string $displayName = '',
        public string $scopeTemplate = '',
        public string $environment = '',
        public array $allowedEnvironments = [],
        public array $scopes = [],
    ) {
    }

    /** @return array<string, string|list<string>> */
    public function serialise(): array
    {
        $body = [
            'companySlug' => $this->companySlug,
            'producerSlug' => $this->producerSlug,
            'displayName' => $this->displayName,
            'scopeTemplate' => $this->scopeTemplate,
            'environment' => $this->environment,
            'allowedEnvironments' => $this->allowedEnvironments,
            'scopes' => $this->scopes,
        ];

        return array_filter($body, static fn (string|array $value): bool => $value !== '' && $value !== []);
    }
}
