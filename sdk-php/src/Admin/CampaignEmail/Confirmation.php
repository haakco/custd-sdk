<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

final readonly class Confirmation
{
    public function __construct(
        public string $confirmedAt,
        public string $email,
        public string $evidenceRef,
        public string $source,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'confirmedAt' => $this->confirmedAt,
            'email' => $this->email,
            'evidenceRef' => $this->evidenceRef,
            'source' => $this->source,
        ];

        return $body;
    }
}
