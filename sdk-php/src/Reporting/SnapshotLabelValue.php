<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting;

use HaakCo\Custd\Fields;

final readonly class SnapshotLabelValue
{
    public function __construct(
        public string $displayName,
        public string $uuid,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'displayName'),
            Fields::string($payload, 'uuid'),
        );
    }
}
