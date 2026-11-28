<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageConnectorEnrollment
{
    public function __construct(
        public AppMessageConnectorStatus $status,
        public string $bearerToken,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AppMessageConnectorStatus::fromPayload(Fields::object($payload, 'status')),
            Fields::string($payload, 'bearerToken'),
        );
    }
}
