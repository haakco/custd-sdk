<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

final readonly class EmailRelayTestSendRequest
{
    public function __construct(
        public string $recipient,
        public ?CampaignTestSelection $campaign = null,
        public ?string $receiptRevision = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'recipient' => $this->recipient,
        ];
        if ($this->campaign !== null) {
            $body['campaign'] = $this->campaign->serialise();
        }

        if ($this->receiptRevision !== null) {
            $body['receiptRevision'] = $this->receiptRevision;
        }

        return $body;
    }
}
