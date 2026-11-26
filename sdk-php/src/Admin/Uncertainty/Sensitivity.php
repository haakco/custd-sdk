<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Sensitivity
{
    /**
     * @param list<InputSensitivity> $inputs
     */
    public function __construct(
        public array $inputs,
        public string $output,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(InputSensitivity::fromPayload(...), Fields::objects($payload, 'inputs')),
            Fields::string($payload, 'output'),
        );
    }
}
