<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class CompiledPresentation
{
    /**
     * @param list<PresentationLayer> $layers
     * @param list<PresentationReference> $references
     * @param list<PresentationTableColumn> $tableColumns
     * @param list<PresentationTableRow> $tableRows
     * @param list<PresentationSupportingTable> $supportingTables
     */
    public function __construct(
        public string $caption,
        public int $height,
        public array $layers,
        public string $nonColorEncoding,
        public string $presetId,
        public array $references,
        public string $renderer,
        public string $summary,
        public array $tableColumns,
        public array $tableRows,
        public int $version,
        public int $width,
        public array $supportingTables = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'caption'),
            Fields::integer($payload, 'height'),
            array_map(PresentationLayer::fromPayload(...), Fields::objects($payload, 'layers')),
            Fields::string($payload, 'nonColorEncoding'),
            Fields::string($payload, 'presetId'),
            array_map(PresentationReference::fromPayload(...), Fields::objects($payload, 'references')),
            Fields::string($payload, 'renderer'),
            Fields::string($payload, 'summary'),
            array_map(PresentationTableColumn::fromPayload(...), Fields::objects($payload, 'tableColumns')),
            array_map(PresentationTableRow::fromPayload(...), Fields::objects($payload, 'tableRows')),
            Fields::integer($payload, 'version'),
            Fields::integer($payload, 'width'),
            array_map(PresentationSupportingTable::fromPayload(...), Fields::optionalObjects($payload, 'supportingTables') ?? []),
        );
    }
}
