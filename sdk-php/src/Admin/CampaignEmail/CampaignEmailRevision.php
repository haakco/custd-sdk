<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\CampaignEmail;

use HaakCo\Custd\Fields;

final readonly class CampaignEmailRevision
{
    public function __construct(
        public string $artifactJson,
        public string $publishedAt,
        public string $revision,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'artifactJson'),
            Fields::string($payload, 'publishedAt'),
            Fields::string($payload, 'revision'),
        );
    }
}
