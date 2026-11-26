<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Fields;

final readonly class CampaignRunRecipientStatus
{
    public function __construct(
        public int $position,
        public string $state,
        public ?string $deliveryUuid = null,
        public ?string $reason = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'position'),
            Fields::string($payload, 'state'),
            Fields::optionalString($payload, 'deliveryUuid'),
            Fields::optionalString($payload, 'reason'),
        );
    }
}
