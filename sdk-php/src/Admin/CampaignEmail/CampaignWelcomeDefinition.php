<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Admin\EmailRelay\CampaignTestSelection;

final readonly class CampaignWelcomeDefinition
{
    public function __construct(
        public CampaignTestSelection $reminder,
        public string $version,
        public CampaignTestSelection $welcome,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'reminder' => $this->reminder->serialise(),
            'version' => $this->version,
            'welcome' => $this->welcome->serialise(),
        ];

        return $body;
    }
}
