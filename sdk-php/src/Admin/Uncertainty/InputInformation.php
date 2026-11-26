<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class InputInformation
{
    public function __construct(
        public float $expectedValueOfPerfectInformation,
        public string $name,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::number($payload, 'expectedValueOfPerfectInformation'),
            Fields::string($payload, 'name'),
        );
    }
}
