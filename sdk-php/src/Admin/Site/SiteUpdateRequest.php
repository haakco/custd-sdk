<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Site;

final readonly class SiteUpdateRequest
{
    /**
     * @param list<string> $allowedOrigins
     * @param list<string>|null $allowedEnvironments
     */
    public function __construct(
        public array $allowedOrigins,
        public string $environment,
        public string $identityMode,
        public ?array $allowedEnvironments = null,
        public ?SiteIngestTarget $ingestTarget = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'allowedOrigins' => $this->allowedOrigins,
            'environment' => $this->environment,
            'identityMode' => $this->identityMode,
        ];
        if ($this->allowedEnvironments !== null) {
            $body['allowedEnvironments'] = $this->allowedEnvironments;
        }
        if ($this->ingestTarget !== null) {
            $body['ingestTarget'] = $this->ingestTarget->serialise();
        }

        return $body;
    }
}
