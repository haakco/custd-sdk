<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

use HaakCo\Custd\Fields;

final readonly class AuditRetentionDisclosure
{
    public function __construct(
        public int $eventMaxAgeSeconds,
        public int $ipAddressMaxAgeSeconds,
        public int $userAgentMaxAgeSeconds,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'eventMaxAgeSeconds'),
            Fields::integer($payload, 'ipAddressMaxAgeSeconds'),
            Fields::integer($payload, 'userAgentMaxAgeSeconds'),
        );
    }
}
