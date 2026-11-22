<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/**
 * AuthDomainImageSet is one image identity pair: the gateway and its Hydra
 * server/init lineage. Both are null when the deployment declares no slot images.
 */
final readonly class AuthDomainImageSet
{
    public function __construct(public ?string $gateway = null, public ?string $hydra = null)
    {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::optionalString($payload, "gateway"),
            Fields::optionalString($payload, "hydra"),
        );
    }
}
