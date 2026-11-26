<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class Version
{
    /**
     * @param list<Quantity> $quantities
     */
    public function __construct(
        public string $createdAt,
        public string $note,
        public array $quantities,
        public int $versionNumber,
        public string $versionUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'note'),
            array_map(Quantity::fromPayload(...), Fields::objects($payload, 'quantities')),
            Fields::integer($payload, 'versionNumber'),
            Fields::string($payload, 'versionUuid'),
        );
    }
}
