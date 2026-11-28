<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageDeleteSourceResponse
{
    public function __construct(
        public string $source,
        public int $deletedCount,
        public ?int $sourceGeneration = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'source'),
            Fields::integer($payload, 'deletedCount'),
            Fields::optionalInteger($payload, 'sourceGeneration'),
        );
    }
}
