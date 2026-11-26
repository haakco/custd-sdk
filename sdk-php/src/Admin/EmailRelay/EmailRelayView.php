<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

use HaakCo\Custd\Fields;

final readonly class EmailRelayView
{
    public function __construct(
        public EmailRelayEffectiveSender $effective,
        public EmailRelay $relay,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            EmailRelayEffectiveSender::fromPayload(Fields::object($payload, 'effective')),
            EmailRelay::fromPayload(Fields::object($payload, 'relay')),
        );
    }
}
