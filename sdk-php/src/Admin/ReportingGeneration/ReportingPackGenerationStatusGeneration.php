<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingGeneration;

use HaakCo\Custd\Fields;

final readonly class ReportingPackGenerationStatusGeneration
{
    public function __construct(
        public int $generationNumber,
        public int $id,
        public string $packKey,
        public string $state,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'generationNumber'),
            Fields::integer($payload, 'id'),
            Fields::string($payload, 'packKey'),
            Fields::string($payload, 'state'),
        );
    }
}
