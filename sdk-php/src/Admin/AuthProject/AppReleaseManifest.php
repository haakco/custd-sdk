<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseManifest is the stored manifest of one release: its files and routing. */
final readonly class AppReleaseManifest
{
    /** @param list<AppReleaseFile> $files */
    public function __construct(
        public int $version,
        public string $releaseId,
        public string $createdAt,
        public array $files,
        public AppReleaseRouting $routing,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'version'),
            Fields::string($payload, 'releaseId'),
            Fields::string($payload, 'createdAt'),
            array_map(AppReleaseFile::fromPayload(...), Fields::objects($payload, 'files')),
            AppReleaseRouting::fromPayload(Fields::object($payload, 'routing')),
        );
    }
}
