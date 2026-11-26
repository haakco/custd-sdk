<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class BoundInput
{
    /**
     * @param ModelBoundState::* $state
     */
    public function __construct(
        public string $quantity,
        public InputSource $source,
        public string $state,
        public ?string $detail = null,
        public ?string $forecastGeneratedAt = null,
        public ?string $forecastRunUuid = null,
        public ?float $value = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'quantity'),
            InputSource::fromPayload(Fields::object($payload, 'source')),
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'detail'),
            Fields::optionalString($payload, 'forecastGeneratedAt'),
            Fields::optionalString($payload, 'forecastRunUuid'),
            Fields::optionalNumber($payload, 'value'),
        );
    }
}
