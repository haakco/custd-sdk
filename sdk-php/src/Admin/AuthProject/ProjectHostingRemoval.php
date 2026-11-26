<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

use HaakCo\Custd\Fields;

/** ProjectHostingRemoval is what a project delete removed from one environment's hosted application. */
final readonly class ProjectHostingRemoval
{
    public function __construct(
        public string $environmentId,
        public string $slug,
        public HostingRemoval $removed,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'environmentId'),
            Fields::string($payload, 'slug'),
            HostingRemoval::fromPayload(Fields::object($payload, 'removed')),
        );
    }
}
