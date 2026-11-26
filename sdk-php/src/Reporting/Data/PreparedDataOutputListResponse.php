<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class PreparedDataOutputListResponse
{
    /**
     * @param list<PreparedDataOutput> $outputs
     */
    public function __construct(
        public array $outputs,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(PreparedDataOutput::fromPayload(...), Fields::objects($payload, 'outputs')),
        );
    }
}
