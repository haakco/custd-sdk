<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class NarrativeBlock
{
    /**
     * @param list<NarrativeValueReference> $references
     */
    public function __construct(
        public string $text,
        public array $references = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'text'),
            array_map(NarrativeValueReference::fromPayload(...), Fields::optionalObjects($payload, 'references') ?? []),
        );
    }
}
