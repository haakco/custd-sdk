<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

use HaakCo\Custd\Fields;

/**
 * EmailRelayView is the sender the tenant's next message uses and the tenant's own relay, null when the
 * tenant has none and sends through Custd's relay.
 */
final readonly class EmailRelayView
{
    public function __construct(
        public EmailRelayEffectiveSender $effective,
        public ?EmailRelay $relay,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $relay = Fields::optionalObject($payload, 'relay');

        return new self(
            EmailRelayEffectiveSender::fromPayload(Fields::object($payload, 'effective')),
            $relay === null ? null : EmailRelay::fromPayload($relay),
        );
    }
}
