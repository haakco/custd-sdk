<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

use HaakCo\Custd\Fields;

final readonly class SDKVersionDeprecation
{
    public function __construct(
        public string $deprecatedAt,
        public string $markedBy,
        public string $note,
        public string $recommendedVersion,
        public string $sdk,
        public string $versionScope,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'deprecatedAt'),
            Fields::string($payload, 'markedBy'),
            Fields::string($payload, 'note'),
            Fields::string($payload, 'recommendedVersion'),
            Fields::string($payload, 'sdk'),
            Fields::string($payload, 'versionScope'),
        );
    }
}
