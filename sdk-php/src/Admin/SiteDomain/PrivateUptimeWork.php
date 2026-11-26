<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/** PrivateUptimeWork acknowledges a request for a new private network probe observation. */
final readonly class PrivateUptimeWork
{
    public function __construct(public ?string $requestedAt = null)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::optionalString($payload, 'requestedAt'));
    }
}
