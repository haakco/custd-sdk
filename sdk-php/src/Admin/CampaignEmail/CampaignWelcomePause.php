<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

final readonly class CampaignWelcomePause
{
    public function __construct(
        public ?bool $paused = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->paused !== null) {
            $body['paused'] = $this->paused;
        }

        return $body;
    }
}
