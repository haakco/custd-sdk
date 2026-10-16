<?php

declare(strict_types=1);

namespace HaakCo\Custd\Auth;

use HaakCo\Custd\Fields;

final readonly class ApplicationAuthorityDecision
{
    public function __construct(public bool $authorized, public string $reason)
    {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'application authority decision');

        return new self(Fields::boolean($object, 'authorized'), Fields::string($object, 'reason'));
    }
}
