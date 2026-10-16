<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** PackTemplate is the canonical query template filled with its flow rule. */
final readonly class PackTemplate
{
    /**
     * @param list<string> $allowedMetrics
     * @param list<string>|null $allowedDimensions
     * @param list<FilterDefinition>|null $allowedFilters
     * @param list<string> $sourceModes
     * @param list<string>|null $compositionRules
     * @param list<string> $eventTypes
     */
    public function __construct(
        public string $name,
        public array $allowedMetrics,
        public array $sourceModes,
        public int $maxRows,
        public array $eventTypes,
        public string $aggregation,
        public ?array $allowedDimensions = null,
        public ?array $allowedFilters = null,
        public ?string $defaultRange = null,
        public ?SubjectScopeRule $subjectScope = null,
        public ?array $compositionRules = null,
        public ?string $flowRule = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $filters = Fields::optionalObjects($payload, 'allowedFilters');
        $subjectScope = Fields::optionalObject($payload, 'subjectScope');

        return new self(
            Fields::string($payload, 'name'),
            Fields::strings($payload, 'allowedMetrics'),
            Fields::strings($payload, 'sourceModes'),
            Fields::integer($payload, 'maxRows'),
            Fields::strings($payload, 'eventTypes'),
            Fields::string($payload, 'aggregation'),
            Fields::optionalStrings($payload, 'allowedDimensions'),
            $filters === null ? null : array_map(static fn (\stdClass $item): FilterDefinition => FilterDefinition::fromPayload($item), $filters),
            Fields::optionalString($payload, 'defaultRange'),
            $subjectScope === null ? null : SubjectScopeRule::fromPayload($subjectScope),
            Fields::optionalStrings($payload, 'compositionRules'),
            Fields::optionalString($payload, 'flowRule'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'name' => $this->name,
            'allowedMetrics' => $this->allowedMetrics,
            'sourceModes' => $this->sourceModes,
            'maxRows' => $this->maxRows,
            'eventTypes' => $this->eventTypes,
            'aggregation' => $this->aggregation,
        ];
        if ($this->allowedDimensions !== null) {
            $payload['allowedDimensions'] = $this->allowedDimensions;
        }
        if ($this->allowedFilters !== null) {
            $payload['allowedFilters'] = array_map(static fn (FilterDefinition $item): array => $item->serialise(), $this->allowedFilters);
        }
        if ($this->defaultRange !== null) {
            $payload['defaultRange'] = $this->defaultRange;
        }
        if ($this->subjectScope !== null) {
            $payload['subjectScope'] = $this->subjectScope->serialise();
        }
        if ($this->compositionRules !== null) {
            $payload['compositionRules'] = $this->compositionRules;
        }
        if ($this->flowRule !== null) {
            $payload['flowRule'] = $this->flowRule;
        }

        return $payload;
    }
}
