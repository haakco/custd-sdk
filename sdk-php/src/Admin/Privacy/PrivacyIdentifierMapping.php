<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

use HaakCo\Custd\Fields;

final readonly class PrivacyIdentifierMapping
{
    public function __construct(
        public string $createdAt,
        public string $identifierId,
        public string $internalIdHash,
        public string $internalIdHashPrefix,
        public int $saltVersion,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'identifierId'),
            Fields::string($payload, 'internalIdHash'),
            Fields::string($payload, 'internalIdHashPrefix'),
            Fields::integer($payload, 'saltVersion'),
        );
    }
}
