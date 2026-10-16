<?php

declare(strict_types=1);

namespace HaakCo\Custd\Parsers;

use HaakCo\Custd\Fields;

/**
 * ParserPreset is one built-in reusable parser definition from the published
 * catalog. Clients turn a preset into a tenant-owned parser through
 * {@see Client::create()}.
 */
final readonly class ParserPreset
{
    /**
     * @param array<string, string> $fieldMapping
     * @param list<string> $variants
     */
    public function __construct(
        public string $code = "",
        public string $name = "",
        public string $family = "",
        public string $description = "",
        public string $parserType = "",
        public string $pattern = "",
        public string $timestampFormat = "",
        public array $fieldMapping = [],
        public string $sample = "",
        public array $variants = [],
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, "code"),
            Fields::string($payload, "name"),
            Fields::string($payload, "family"),
            Fields::string($payload, "description"),
            Fields::string($payload, "parserType"),
            Fields::string($payload, "pattern"),
            Fields::string($payload, "timestampFormat"),
            Fields::stringMap($payload, "fieldMapping"),
            Fields::string($payload, "sample"),
            Fields::optionalStrings($payload, "variants") ?? [],
        );
    }
}
