<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class SiteConfigResponse
{
    /**
     * @param list<string> $allowedOrigins
     */
    public function __construct(
        public array $allowedOrigins,
        public string $environment,
        public string $identityMode,
        public string $siteUuid,
        public ?string $pageViewSchemaVersion = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::strings($payload, 'allowedOrigins'),
            Fields::string($payload, 'environment'),
            Fields::string($payload, 'identityMode'),
            Fields::string($payload, 'siteUuid'),
            Fields::optionalString($payload, 'pageViewSchemaVersion'),
        );
    }
}
