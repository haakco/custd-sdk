<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

final readonly class Recipient
{
    public function __construct(
        public string $email,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'email' => $this->email,
        ];

        return $body;
    }
}
