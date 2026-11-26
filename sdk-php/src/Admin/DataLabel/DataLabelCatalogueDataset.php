<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelCatalogueDataset
{
    /**
     * @param list<string> $valueUuids
     */
    public function __construct(
        public string $displayName,
        public ?string $definitionUuid = null,
        public ?string $unit = null,
        public array $valueUuids = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'displayName'),
            Fields::optionalString($payload, 'definitionUuid'),
            Fields::optionalString($payload, 'unit'),
            Fields::optionalStrings($payload, 'valueUuids') ?? [],
        );
    }
}
