<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RedactionRule declares which fields survive redaction for one source. */
final readonly class RedactionRule
{
    /**
     * @param list<string> $selectorFields
     * @param list<string> $allowedFields
     * @param list<string> $reasonClasses
     */
    public function __construct(
        public string $sourceSystem,
        public string $sourceEventType,
        public array $selectorFields,
        public array $allowedFields,
        public array $reasonClasses,
        public string $resultShape,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'sourceSystem'),
            Fields::string($payload, 'sourceEventType'),
            Fields::strings($payload, 'selectorFields'),
            Fields::strings($payload, 'allowedFields'),
            Fields::strings($payload, 'reasonClasses'),
            Fields::string($payload, 'resultShape'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'sourceSystem' => $this->sourceSystem,
            'sourceEventType' => $this->sourceEventType,
            'selectorFields' => $this->selectorFields,
            'allowedFields' => $this->allowedFields,
            'reasonClasses' => $this->reasonClasses,
            'resultShape' => $this->resultShape,
        ];
    }
}
