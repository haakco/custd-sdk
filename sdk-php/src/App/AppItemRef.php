<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/**
 * AppItemRef names an item the signed-in user owns, reached with their access token and no link.
 * Pass it where an item call takes a link token.
 */
final readonly class AppItemRef
{
    public function __construct(public string $itemUuid)
    {
        if (trim($itemUuid) === '') {
            throw new \InvalidArgumentException('custd: an app item reference needs its item UUID');
        }
    }
}
