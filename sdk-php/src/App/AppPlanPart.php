<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppPlanPart
{
    /**
     * @param list<string> $prerequisites
     */
    public function __construct(
        public string $itemUuid,
        public array $prerequisites,
        public bool $required,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'itemUuid'),
            Fields::strings($payload, 'prerequisites'),
            Fields::boolean($payload, 'required'),
        );
    }
}
