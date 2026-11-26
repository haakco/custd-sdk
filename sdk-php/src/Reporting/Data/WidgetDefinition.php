<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class WidgetDefinition
{
    /**
     * @param list<string> $metrics
     * @param list<string> $dimensions
     */
    public function __construct(
        public string $key,
        public string $kind,
        public array $metrics,
        public string $template,
        public string $title,
        public array $dimensions = [],
        public ?PresentationPresetSelection $presentation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $presentation = Fields::optionalObject($payload, 'presentation');

        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'kind'),
            Fields::strings($payload, 'metrics'),
            Fields::string($payload, 'template'),
            Fields::string($payload, 'title'),
            Fields::optionalStrings($payload, 'dimensions') ?? [],
            $presentation === null ? null : PresentationPresetSelection::fromPayload($presentation),
        );
    }
}
