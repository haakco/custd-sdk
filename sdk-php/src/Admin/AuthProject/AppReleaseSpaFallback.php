<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseSpaFallback serves file for any path under prefix that names no file. */
final readonly class AppReleaseSpaFallback
{
    public function __construct(public string $prefix, public string $file)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'prefix'), Fields::string($payload, 'file'));
    }

    /** @return array{prefix: string, file: string} */
    public function serialise(): array
    {
        return ['prefix' => $this->prefix, 'file' => $this->file];
    }
}
