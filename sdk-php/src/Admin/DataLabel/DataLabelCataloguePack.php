<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelCataloguePack
{
    /**
     * @param list<DataLabelCatalogueDataset> $datasets
     */
    public function __construct(
        public array $datasets,
        public string $displayName,
        public bool $enabled,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DataLabelCatalogueDataset::fromPayload(...), Fields::objects($payload, 'datasets')),
            Fields::string($payload, 'displayName'),
            Fields::boolean($payload, 'enabled'),
        );
    }
}
