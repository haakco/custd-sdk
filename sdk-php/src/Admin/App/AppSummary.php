<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class AppSummary
{
    public function __construct(
        public string $appId,
        public string $environmentId,
        public string $host,
        public string $name,
        public bool $signIn,
        public string $slug,
        public string $status,
        public string $url,
        public ?string $activeReleaseId = null,
        public ?AppReason $reason = null,
        public ?string $servingSince = null,
        public ?string $siteUuid = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $reason = Fields::optionalObject($payload, 'reason');

        return new self(
            Fields::string($payload, 'appId'),
            Fields::string($payload, 'environmentId'),
            Fields::string($payload, 'host'),
            Fields::string($payload, 'name'),
            Fields::boolean($payload, 'signIn'),
            Fields::string($payload, 'slug'),
            Fields::string($payload, 'status'),
            Fields::string($payload, 'url'),
            Fields::optionalString($payload, 'activeReleaseId'),
            $reason === null ? null : AppReason::fromPayload($reason),
            Fields::optionalString($payload, 'servingSince'),
            Fields::optionalString($payload, 'siteUuid'),
        );
    }
}
