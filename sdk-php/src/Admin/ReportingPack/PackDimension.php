<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** PackDimension is the canonical pack dimension (DimensionDefinition plus its selector). */
final readonly class PackDimension
{
    /** @param list<string>|null $labelValueUuids */
    public function __construct(
        public string $key,
        public string $label,
        public string $selector,
        public ?string $description = null,
        public ?string $labelDefinitionUuid = null,
        public ?string $labelDefinitionKey = null,
        public ?array $labelValueUuids = null,
        public ?string $allowedValuePattern = null,
        public ?string $fallback = null,
        public ?int $maxCardinality = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            Fields::string($payload, 'selector'),
            Fields::optionalString($payload, 'description'),
            Fields::optionalString($payload, 'labelDefinitionUuid'),
            Fields::optionalString($payload, 'labelDefinitionKey'),
            Fields::optionalStrings($payload, 'labelValueUuids'),
            Fields::optionalString($payload, 'allowedValuePattern'),
            Fields::optionalString($payload, 'fallback'),
            Fields::optionalInteger($payload, 'maxCardinality'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ['key' => $this->key, 'label' => $this->label, 'selector' => $this->selector];
        foreach (['description' => $this->description, 'labelDefinitionUuid' => $this->labelDefinitionUuid, 'labelDefinitionKey' => $this->labelDefinitionKey, 'allowedValuePattern' => $this->allowedValuePattern, 'fallback' => $this->fallback] as $key => $value) {
            if ($value !== null) {
                $payload[$key] = $value;
            }
        }
        if ($this->labelValueUuids !== null) {
            $payload['labelValueUuids'] = $this->labelValueUuids;
        }
        if ($this->maxCardinality !== null) {
            $payload['maxCardinality'] = $this->maxCardinality;
        }

        return $payload;
    }
}
