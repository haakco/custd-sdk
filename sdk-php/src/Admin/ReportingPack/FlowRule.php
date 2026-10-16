<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** FlowRule correlates the start and completion markers of one flow. */
final readonly class FlowRule
{
    /**
     * @param list<string> $startMarkers
     * @param list<string> $completionMarkers
     */
    public function __construct(
        public string $key,
        public string $correlationSelector,
        public string $familySelector,
        public string $stepSelector,
        public array $startMarkers,
        public array $completionMarkers,
        public bool $includeUncorrelated,
        public ?string $familyValue = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'correlationSelector'),
            Fields::string($payload, 'familySelector'),
            Fields::string($payload, 'stepSelector'),
            Fields::strings($payload, 'startMarkers'),
            Fields::strings($payload, 'completionMarkers'),
            Fields::boolean($payload, 'includeUncorrelated'),
            Fields::optionalString($payload, 'familyValue'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'correlationSelector' => $this->correlationSelector,
            'familySelector' => $this->familySelector,
            'stepSelector' => $this->stepSelector,
            'startMarkers' => $this->startMarkers,
            'completionMarkers' => $this->completionMarkers,
            'includeUncorrelated' => $this->includeUncorrelated,
        ];
        if ($this->familyValue !== null) {
            $payload['familyValue'] = $this->familyValue;
        }

        return $payload;
    }
}
