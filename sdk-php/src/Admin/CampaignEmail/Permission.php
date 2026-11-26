<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Fields;

final readonly class Permission
{
    public function __construct(
        public bool $eligible,
        public ?string $confirmedAt = null,
        public ?string $withdrawnAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'eligible'),
            Fields::optionalString($payload, 'confirmedAt'),
            Fields::optionalString($payload, 'withdrawnAt'),
        );
    }
}
