<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** NarrativeValueReference points a narrative block at a widget's value. */
final readonly class NarrativeValueReference
{
    public function __construct(
        public string $widgetKey,
        public string $value,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'widgetKey'), Fields::string($payload, 'value'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['widgetKey' => $this->widgetKey, 'value' => $this->value];
    }
}
