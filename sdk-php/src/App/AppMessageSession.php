<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppMessageSession
{
    public function __construct(
        public string $companySlug,
        public string $principalId,
        public bool $importAllowed,
        public ?int $whatsappSourceGeneration = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'companySlug'),
            Fields::string($payload, 'principalId'),
            Fields::boolean($payload, 'importAllowed'),
            Fields::optionalInteger($payload, 'whatsappSourceGeneration'),
        );
    }
}
