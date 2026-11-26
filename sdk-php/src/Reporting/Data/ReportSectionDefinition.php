<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class ReportSectionDefinition
{
    /**
     * @param list<NarrativeBlock> $narrative
     * @param list<string> $widgetKeys
     * @param ReportSectionLayout::* $layout
     */
    public function __construct(
        public int $columnSpan,
        public string $key,
        public string $layout,
        public string $title,
        public array $narrative = [],
        public array $widgetKeys = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'columnSpan'),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'layout'),
            Fields::string($payload, 'title'),
            array_map(NarrativeBlock::fromPayload(...), Fields::optionalObjects($payload, 'narrative') ?? []),
            Fields::optionalStrings($payload, 'widgetKeys') ?? [],
        );
    }
}
