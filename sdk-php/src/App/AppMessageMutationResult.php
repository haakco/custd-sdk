<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageMutationResult
{
    public function __construct(
        public string $externalId,
        public string $operationId,
        public string $status,
        public ?string $errorCode = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'externalId'),
            Fields::string($payload, 'operationId'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'errorCode'),
        );
    }
}
