<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

final readonly class DataLabelDefinitionCreateRequest
{
    /**
     * @param list<string> $allowedScopes
     * @param list<string> $synonyms
     */
    public function __construct(
        public array $allowedScopes,
        public string $description,
        public string $displayName,
        public string $intendedUse,
        public string $key,
        public string $propagationPolicy,
        public string $sensitivity,
        public array $synonyms,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'allowedScopes' => $this->allowedScopes,
            'description' => $this->description,
            'displayName' => $this->displayName,
            'intendedUse' => $this->intendedUse,
            'key' => $this->key,
            'propagationPolicy' => $this->propagationPolicy,
            'sensitivity' => $this->sensitivity,
            'synonyms' => $this->synonyms,
        ];

        return $body;
    }
}
