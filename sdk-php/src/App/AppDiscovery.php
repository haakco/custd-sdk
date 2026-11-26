<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

/**
 * AppDiscovery is a hosted application's public discovery document: its API origin, Site, browser key and
 * sign-in registration.
 */
final readonly class AppDiscovery
{
    /**
     * @param list<string> $capabilities
     * @param list<string> $allowedOrigins
     */
    public function __construct(
        public string $apiBaseUrl,
        public string $host,
        public string $siteUuid,
        public string $browserKey,
        public string $environment,
        public array $capabilities,
        public string $identityMode,
        public array $allowedOrigins,
        public ?AppDiscoverySignIn $signIn = null,
        public ?string $pageViewSchemaVersion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $signIn = Fields::optionalObject($payload, 'signIn');

        return new self(
            Fields::string($payload, 'apiBaseUrl'),
            Fields::string($payload, 'host'),
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'browserKey'),
            Fields::string($payload, 'environment'),
            Fields::strings($payload, 'capabilities'),
            Fields::string($payload, 'identityMode'),
            Fields::strings($payload, 'allowedOrigins'),
            $signIn === null ? null : AppDiscoverySignIn::fromPayload($signIn),
            Fields::optionalString($payload, 'pageViewSchemaVersion'),
        );
    }
}
