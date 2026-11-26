<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class AppDeployCredentialSummary
{
    public function __construct(
        public string $clientId,
        public string $createdAt,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'clientId'),
            Fields::string($payload, 'createdAt'),
        );
    }
}
