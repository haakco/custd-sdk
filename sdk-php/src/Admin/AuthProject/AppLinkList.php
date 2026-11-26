<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** AppLinkList is the application items linked to an environment. */
final readonly class AppLinkList
{
    /** @param list<AppLink> $links */
    public function __construct(public array $links = [])
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'app link list');

        return new self(array_map(AppLink::fromPayload(...), Fields::objects($object, 'links')));
    }
}
