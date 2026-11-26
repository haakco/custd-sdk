<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

final readonly class CampaignWelcomeSignup
{
    public function __construct(
        public string $confirmedAt,
        public string $contactId,
        public string $email,
        public string $evidenceRef,
        public string $evidenceSource,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'confirmedAt' => $this->confirmedAt,
            'contactId' => $this->contactId,
            'email' => $this->email,
            'evidenceRef' => $this->evidenceRef,
            'evidenceSource' => $this->evidenceSource,
        ];

        return $body;
    }
}
