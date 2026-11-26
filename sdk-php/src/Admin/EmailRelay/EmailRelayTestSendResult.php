<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

use HaakCo\Custd\Fields;

final readonly class EmailRelayTestSendResult
{
    /**
     * @param list<string> $deliveryUuids
     */
    public function __construct(
        public bool $accepted,
        public array $deliveryUuids,
        public string $messageUuid,
        public EmailRelayEffectiveSender $sender,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'accepted'),
            Fields::strings($payload, 'deliveryUuids'),
            Fields::string($payload, 'messageUuid'),
            EmailRelayEffectiveSender::fromPayload(Fields::object($payload, 'sender')),
        );
    }
}
