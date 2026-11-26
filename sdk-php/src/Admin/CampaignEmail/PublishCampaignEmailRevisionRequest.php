<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

final readonly class PublishCampaignEmailRevisionRequest
{
    public function __construct(
        public string $artifactJson,
        public string $revision,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'artifactJson' => $this->artifactJson,
            'revision' => $this->revision,
        ];

        return $body;
    }
}
