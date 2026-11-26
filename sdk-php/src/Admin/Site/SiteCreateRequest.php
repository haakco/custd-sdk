<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

final readonly class SiteCreateRequest
{
    /**
     * @param list<string> $allowedOrigins
     * @param list<string>|null $allowedEnvironments
     */
    public function __construct(
        public array $allowedOrigins,
        public string $companySlug,
        public string $environment,
        public string $identityMode,
        public SiteIngestTarget $ingestTarget,
        public string $name,
        public ?array $allowedEnvironments = null,
        public ?int $rateLimitPerMinute = null,
        public ?int $retentionDays = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'allowedOrigins' => $this->allowedOrigins,
            'companySlug' => $this->companySlug,
            'environment' => $this->environment,
            'identityMode' => $this->identityMode,
            'ingestTarget' => $this->ingestTarget->serialise(),
            'name' => $this->name,
        ];
        if ($this->allowedEnvironments !== null) {
            $body['allowedEnvironments'] = $this->allowedEnvironments;
        }
        if ($this->rateLimitPerMinute !== null) {
            $body['rateLimitPerMinute'] = $this->rateLimitPerMinute;
        }
        if ($this->retentionDays !== null) {
            $body['retentionDays'] = $this->retentionDays;
        }

        return $body;
    }
}
