<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Fields;

final readonly class CampaignWelcomeState
{
    public function __construct(
        public bool $paused,
        public string $version,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'paused'),
            Fields::string($payload, 'version'),
        );
    }
}
