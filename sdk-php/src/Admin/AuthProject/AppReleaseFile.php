<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseFile is one manifest file; sha256 is the lowercase hex digest the upload must carry. */
final readonly class AppReleaseFile
{
    public function __construct(
        public string $path,
        public int $size,
        public string $sha256,
        public string $contentType,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'path'),
            Fields::integer($payload, 'size'),
            Fields::string($payload, 'sha256'),
            Fields::string($payload, 'contentType'),
        );
    }

    /** @return array{path: string, size: int, sha256: string, contentType: string} */
    public function serialise(): array
    {
        return ['path' => $this->path, 'size' => $this->size, 'sha256' => $this->sha256, 'contentType' => $this->contentType];
    }
}
