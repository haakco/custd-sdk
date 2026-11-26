<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** SigningRefusalCounts counts the signed events ingest refused for one producer, by reason. */
final readonly class SigningRefusalCounts
{
    public function __construct(
        public int $bindingNotReady,
        public int $bindingCancelled,
        public int $invalidSignature,
        public ?string $lastRefusedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'bindingNotReady'),
            Fields::integer($payload, 'bindingCancelled'),
            Fields::integer($payload, 'invalidSignature'),
            Fields::optionalString($payload, 'lastRefusedAt'),
        );
    }
}
