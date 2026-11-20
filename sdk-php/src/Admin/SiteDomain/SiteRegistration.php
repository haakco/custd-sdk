<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** Registry lookup. An absent expiry date means the registry did not supply one. */
final readonly class SiteRegistration
{
    public function __construct(
        public string $domain,
        public ?string $source,
        public string $readAt,
        public ?string $expiresAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'domain'),
            Fields::optionalString($payload, 'source'),
            Fields::string($payload, 'readAt'),
            Fields::optionalString($payload, 'expiresAt'),
        );
    }
}
