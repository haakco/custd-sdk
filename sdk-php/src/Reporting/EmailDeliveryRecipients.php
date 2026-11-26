<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class EmailDeliveryRecipients
{
    /**
     * @param list<EmailDeliveryRecipient> $recipients
     */
    public function __construct(
        public bool $complete,
        public array $recipients,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'complete'),
            array_map(EmailDeliveryRecipient::fromPayload(...), Fields::objects($payload, 'recipients')),
        );
    }
}
