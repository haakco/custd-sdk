<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class ResourceStatus
{
    public function __construct(
        public string $key,
        public string $kind,
        public bool $ready,
        public string $safeNextAction,
        public string $safeNextActionCode,
        public string $state,
        public ?string $detail = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'kind'),
            Fields::boolean($payload, 'ready'),
            Fields::string($payload, 'safeNextAction'),
            Fields::string($payload, 'safeNextActionCode'),
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'detail'),
        );
    }
}
