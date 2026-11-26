<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingGeneration;

use HaakCo\Custd\Fields;

final readonly class ReportingPackGenerationAcknowledgementStatus
{
    public function __construct(
        public bool $accepted,
        public string $consumer,
        public string $observedAt,
        public int $observedGenerationId,
        public ?string $errorDetail = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'accepted'),
            Fields::string($payload, 'consumer'),
            Fields::string($payload, 'observedAt'),
            Fields::integer($payload, 'observedGenerationId'),
            Fields::optionalString($payload, 'errorDetail'),
        );
    }
}
