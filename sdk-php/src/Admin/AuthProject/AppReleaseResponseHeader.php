<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseResponseHeader is one extra response header a header rule sets. */
final readonly class AppReleaseResponseHeader
{
    public function __construct(public string $name, public string $value)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'name'), Fields::string($payload, 'value'));
    }

    /** @return array{name: string, value: string} */
    public function serialise(): array
    {
        return ['name' => $this->name, 'value' => $this->value];
    }
}
