<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class ArtifactResponse
{
    /**
     * @param list<string> $warnings
     */
    public function __construct(
        public string $artifactKey,
        public string $filename,
        public string $format,
        public string $id,
        public string $mediaType,
        public int $objectBytes,
        public string $objectSha256,
        public ?string $fallbackForFormat = null,
        public ?string $rendererVersion = null,
        public array $warnings = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'artifactKey'),
            Fields::string($payload, 'filename'),
            Fields::string($payload, 'format'),
            Fields::string($payload, 'id'),
            Fields::string($payload, 'mediaType'),
            Fields::integer($payload, 'objectBytes'),
            Fields::string($payload, 'objectSha256'),
            Fields::optionalString($payload, 'fallbackForFormat'),
            Fields::optionalString($payload, 'rendererVersion'),
            Fields::optionalStrings($payload, 'warnings') ?? [],
        );
    }
}
