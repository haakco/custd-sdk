<?php

declare(strict_types=1);

namespace HaakCo\Custd\Analytics\Measurement;

use HaakCo\Custd\Fields;

final readonly class PresentationSupportingTable
{
    /**
     * @param list<PresentationTableColumn> $columns
     * @param list<PresentationSupportingTableRow> $rows
     */
    public function __construct(
        public array $columns,
        public string $key,
        public string $label,
        public array $rows,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(PresentationTableColumn::fromPayload(...), Fields::objects($payload, 'columns')),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            array_map(PresentationSupportingTableRow::fromPayload(...), Fields::objects($payload, 'rows')),
        );
    }
}
