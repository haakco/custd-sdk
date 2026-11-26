<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

use HaakCo\Custd\Fields;

final readonly class SiteCreateResponse
{
    /**
     * @param list<string> $allowedEnvironments
     * @param list<string> $allowedOrigins
     */
    public function __construct(
        public array $allowedEnvironments,
        public array $allowedOrigins,
        public string $companySlug,
        public bool $enabled,
        public string $environment,
        public string $identityMode,
        public string $name,
        public int $rateLimitPerMinute,
        public int $retentionDays,
        public string $siteUuid,
        public string $writeKey,
        public ?SiteIngestTarget $ingestTarget = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $ingestTarget = Fields::optionalObject($payload, 'ingestTarget');

        return new self(
            Fields::strings($payload, 'allowedEnvironments'),
            Fields::strings($payload, 'allowedOrigins'),
            Fields::string($payload, 'companySlug'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'environment'),
            Fields::string($payload, 'identityMode'),
            Fields::string($payload, 'name'),
            Fields::integer($payload, 'rateLimitPerMinute'),
            Fields::integer($payload, 'retentionDays'),
            Fields::string($payload, 'siteUuid'),
            Fields::string($payload, 'writeKey'),
            $ingestTarget === null ? null : SiteIngestTarget::fromPayload($ingestTarget),
        );
    }
}
