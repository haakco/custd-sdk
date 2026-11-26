<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelCatalogueResponse
{
    /**
     * @param list<DataLabelCatalogueAssignment> $assignments
     * @param list<DataLabelCataloguePack> $reportingPacks
     */
    public function __construct(
        public array $assignments,
        public DescriptiveLabelCatalogue $catalogue,
        public string $fingerprint,
        public array $reportingPacks,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(DataLabelCatalogueAssignment::fromPayload(...), Fields::objects($payload, 'assignments')),
            DescriptiveLabelCatalogue::fromPayload(Fields::object($payload, 'catalogue')),
            Fields::string($payload, 'fingerprint'),
            array_map(DataLabelCataloguePack::fromPayload(...), Fields::objects($payload, 'reportingPacks')),
        );
    }
}
