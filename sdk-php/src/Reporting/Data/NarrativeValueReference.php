<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class NarrativeValueReference
{
    /**
     * @param NarrativeValue::* $value
     */
    public function __construct(
        public string $value,
        public string $widgetKey,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'value'),
            Fields::string($payload, 'widgetKey'),
        );
    }
}
