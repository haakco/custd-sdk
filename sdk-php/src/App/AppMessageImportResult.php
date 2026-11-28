<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageImportResult
{
    public function __construct(
        public string $externalId,
        public string $status,
        public ?string $messageUuid,
        public ?string $errorCode,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'externalId'),
            Fields::string($payload, 'status'),
            Fields::optionalString($payload, 'messageUuid'),
            Fields::optionalString($payload, 'errorCode'),
        );
    }
}
