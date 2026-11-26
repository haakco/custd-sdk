<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

/** AppReleaseCreateRequest is a new release's files and routing; Custd assigns its identifier. */
final readonly class AppReleaseCreateRequest
{
    /** @param list<AppReleaseFile> $files */
    public function __construct(
        public array $files,
        public AppReleaseRouting $routing = new AppReleaseRouting(),
        public ?string $label = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'files' => array_map(static fn (AppReleaseFile $file): array => $file->serialise(), $this->files),
            'routing' => (object) $this->routing->serialise(),
        ];
        if ($this->label !== null) {
            $body['label'] = $this->label;
        }

        return $body;
    }
}
