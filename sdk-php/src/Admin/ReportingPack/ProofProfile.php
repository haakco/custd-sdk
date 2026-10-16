<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ProofProfile names the proof template and its safe/forbidden metadata fields. */
final readonly class ProofProfile
{
    /**
     * @param list<string> $templates
     * @param list<string> $safeMetadataFields
     * @param list<string> $forbiddenFields
     */
    public function __construct(
        public string $key,
        public array $templates,
        public array $safeMetadataFields,
        public array $forbiddenFields,
        public string $outputLayout,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::strings($payload, 'templates'),
            Fields::strings($payload, 'safeMetadataFields'),
            Fields::strings($payload, 'forbiddenFields'),
            Fields::string($payload, 'outputLayout'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'key' => $this->key,
            'templates' => $this->templates,
            'safeMetadataFields' => $this->safeMetadataFields,
            'forbiddenFields' => $this->forbiddenFields,
            'outputLayout' => $this->outputLayout,
        ];
    }
}
