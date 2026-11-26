<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Admin\EmailRelay\CampaignTestSelection;

final readonly class CampaignRunScheduleRequest
{
    /**
     * @param list<string> $recipients
     */
    public function __construct(
        public CampaignTestSelection $campaign,
        public string $id,
        public array $recipients,
        public string $scheduledAt,
        public ?string $audienceDigest = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'campaign' => $this->campaign->serialise(),
            'id' => $this->id,
            'recipients' => $this->recipients,
            'scheduledAt' => $this->scheduledAt,
        ];
        if ($this->audienceDigest !== null) {
            $body['audienceDigest'] = $this->audienceDigest;
        }

        return $body;
    }
}
