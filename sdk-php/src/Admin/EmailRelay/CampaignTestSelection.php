<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

final readonly class CampaignTestSelection
{
    /**
     * @param array<string, string> $values
     */
    public function __construct(
        public string $revision,
        public array $values,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'revision' => $this->revision,
            'values' => (object) $this->values,
        ];

        return $body;
    }
}
