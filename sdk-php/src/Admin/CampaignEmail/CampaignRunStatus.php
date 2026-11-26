<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Fields;

final readonly class CampaignRunStatus
{
    /**
     * @param list<CampaignRunRecipientStatus> $deliveries
     */
    public function __construct(
        public int $cancelled,
        public array $deliveries,
        public int $excluded,
        public int $failed,
        public string $id,
        public int $pending,
        public int $processing,
        public int $recipients,
        public string $revision,
        public string $scheduledAt,
        public int $sent,
        public ?string $cancelledAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'cancelled'),
            array_map(CampaignRunRecipientStatus::fromPayload(...), Fields::objects($payload, 'deliveries')),
            Fields::integer($payload, 'excluded'),
            Fields::integer($payload, 'failed'),
            Fields::string($payload, 'id'),
            Fields::integer($payload, 'pending'),
            Fields::integer($payload, 'processing'),
            Fields::integer($payload, 'recipients'),
            Fields::string($payload, 'revision'),
            Fields::string($payload, 'scheduledAt'),
            Fields::integer($payload, 'sent'),
            Fields::optionalString($payload, 'cancelledAt'),
        );
    }
}
