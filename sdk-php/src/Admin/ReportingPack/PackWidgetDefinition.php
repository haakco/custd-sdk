<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** PackWidgetDefinition is one widget inside a pack dashboard. */
final readonly class PackWidgetDefinition
{
    /**
     * @param list<string> $metrics
     * @param list<string>|null $dimensions
     */
    public function __construct(
        public string $key,
        public string $title,
        public string $kind,
        public string $template,
        public array $metrics,
        public ?array $dimensions = null,
        public ?PresentationPresetSelection $presentation = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $presentation = Fields::optionalObject($payload, 'presentation');

        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'title'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'template'),
            Fields::strings($payload, 'metrics'),
            Fields::optionalStrings($payload, 'dimensions'),
            $presentation === null ? null : PresentationPresetSelection::fromPayload($presentation),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'title' => $this->title,
            'kind' => $this->kind,
            'template' => $this->template,
            'metrics' => $this->metrics,
        ];
        if ($this->dimensions !== null) {
            $payload['dimensions'] = $this->dimensions;
        }
        if ($this->presentation !== null) {
            $payload['presentation'] = $this->presentation->serialise();
        }

        return $payload;
    }
}
