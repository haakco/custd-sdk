<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

use HaakCo\Custd\Fields;

final readonly class DataLabelDefinition
{
    /**
     * @param list<string> $allowedScopes
     * @param list<string> $synonyms
     * @param list<DataLabelValue> $values
     */
    public function __construct(
        public array $allowedScopes,
        public string $authority,
        public string $createdAt,
        public string $description,
        public string $displayName,
        public bool $enabled,
        public string $intendedUse,
        public string $key,
        public string $propagationPolicy,
        public string $sensitivity,
        public array $synonyms,
        public string $updatedAt,
        public string $uuid,
        public array $values,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::strings($payload, 'allowedScopes'),
            Fields::string($payload, 'authority'),
            Fields::string($payload, 'createdAt'),
            Fields::string($payload, 'description'),
            Fields::string($payload, 'displayName'),
            Fields::boolean($payload, 'enabled'),
            Fields::string($payload, 'intendedUse'),
            Fields::string($payload, 'key'),
            Fields::string($payload, 'propagationPolicy'),
            Fields::string($payload, 'sensitivity'),
            Fields::strings($payload, 'synonyms'),
            Fields::string($payload, 'updatedAt'),
            Fields::string($payload, 'uuid'),
            array_map(DataLabelValue::fromPayload(...), Fields::objects($payload, 'values')),
        );
    }
}
