<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class Provenance
{
    public function __construct(
        public string $owner,
        public ?string $generation = null,
        public ?string $sourceUrn = null,
        public ?string $watermark = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'owner'),
            Fields::optionalString($payload, 'generation'),
            Fields::optionalString($payload, 'sourceUrn'),
            Fields::optionalString($payload, 'watermark'),
        );
    }
}
