<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

use HaakCo\Custd\Fields;

/** ProducerList is the producers the broker provisioned. */
final readonly class ProducerList
{
    /** @param list<Producer> $producers */
    public function __construct(public array $producers = [])
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(array_map(Producer::fromPayload(...), Fields::objects($payload, 'producers')));
    }
}
