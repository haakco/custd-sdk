<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class EmailDeliveryRecipient
{
    public function __construct(
        public string $occurredAt,
        public string $outcome,
        public string $recipientId,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'occurredAt'),
            Fields::string($payload, 'outcome'),
            Fields::string($payload, 'recipientId'),
        );
    }
}
