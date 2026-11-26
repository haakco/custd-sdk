<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class VersionSummary
{
    public function __construct(
        public string $createdAt,
        public string $note,
        public int $quantityCount,
        public int $versionNumber,
        public string $versionUuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'note'),
            Fields::integer($payload, 'quantityCount'),
            Fields::integer($payload, 'versionNumber'),
            Fields::string($payload, 'versionUuid'),
        );
    }
}
