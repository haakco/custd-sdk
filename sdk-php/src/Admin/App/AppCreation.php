<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class AppCreation
{
    public function __construct(
        public AppSummary $app,
        public bool $replayed,
        public string $trafficReporting,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AppSummary::fromPayload(Fields::object($payload, 'app')),
            Fields::boolean($payload, 'replayed'),
            Fields::string($payload, 'trafficReporting'),
        );
    }
}
