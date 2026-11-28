<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageMediaMetadata
{
    public function __construct(
        public string $mediaUuid,
        public string $contentType,
        public int $byteCount,
        public string $ocrStatus,
        public ?string $ocrText,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'mediaUuid'),
            Fields::string($payload, 'contentType'),
            Fields::integer($payload, 'byteCount'),
            Fields::string($payload, 'ocrStatus'),
            Fields::optionalString($payload, 'ocrText'),
        );
    }
}
