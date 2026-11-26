<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppReleaseList is an environment's most recent releases, newest first. */
final readonly class AppReleaseList
{
    /** @param list<AppReleaseSummary> $releases */
    public function __construct(public array $releases = [])
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'app release list');

        return new self(array_map(AppReleaseSummary::fromPayload(...), Fields::objects($object, 'releases')));
    }
}
