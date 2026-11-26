<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseCacheRule applies a cache mode to the files match selects. */
final readonly class AppReleaseCacheRule
{
    /** @param AppReleaseCacheMode::* $mode */
    public function __construct(public string $match, public string $mode)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::string($payload, 'match'), Fields::string($payload, 'mode'));
    }

    /** @return array{match: string, mode: AppReleaseCacheMode::*} */
    public function serialise(): array
    {
        return ['match' => $this->match, 'mode' => $this->mode];
    }
}
