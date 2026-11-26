<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DescriptiveLabel
{
    /**
     * @param list<string> $synonyms
     */
    public function __construct(
        public string $definitionUuid,
        public string $displayName,
        public bool $enabled,
        public string $key,
        public ?string $description = null,
        public ?string $intendedUse = null,
        public ?string $sensitivity = null,
        public array $synonyms = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'definitionUuid'),
            Fields::string($payload, 'displayName'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'key'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'intendedUse'),
            Fields::optionalString($payload, 'sensitivity'),
            Fields::optionalStrings($payload, 'synonyms') ?? [],
        );
    }
}
