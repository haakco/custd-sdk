<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class PresentationTableRow
{
    /**
     * @param list<string> $cells
     */
    public function __construct(
        public array $cells,
        public string $snapshotUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::strings($payload, 'cells'),
            Fields::string($payload, 'snapshotUuid'),
        );
    }
}
