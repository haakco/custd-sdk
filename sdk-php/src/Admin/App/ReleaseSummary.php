<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class ReleaseSummary
{
    public function __construct(
        public bool $active,
        public string $createdAt,
        public int $fileCount,
        public string $releaseId,
        public string $state,
        public int $totalBytes,
        public ?string $label = null,
        public ?string $verifiedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'active'),
            Fields::string($payload, 'createdAt'),
            Fields::integer($payload, 'fileCount'),
            Fields::string($payload, 'releaseId'),
            Fields::string($payload, 'state'),
            Fields::integer($payload, 'totalBytes'),
            Fields::optionalString($payload, 'label'),
            Fields::optionalString($payload, 'verifiedAt'),
        );
    }
}
