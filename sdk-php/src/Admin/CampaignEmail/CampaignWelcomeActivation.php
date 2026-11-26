<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

final readonly class CampaignWelcomeActivation
{
    public function __construct(
        public string $activatedAt,
        public string $contactId,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'activatedAt' => $this->activatedAt,
            'contactId' => $this->contactId,
        ];

        return $body;
    }
}
