<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** PackMetric is the canonical pack metric (MetricDefinition plus its calculation). */
final readonly class PackMetric
{
    /**
     * @param list<MatchPredicate>|null $match
     */
    public function __construct(
        public string $key,
        public string $label,
        public string $kind,
        public string $calculation,
        public ?string $unit = null,
        public ?string $description = null,
        public ?array $match = null,
        public ?string $flowResult = null,
        public ?NumericSelector $numeric = null,
        public ?SelectorDefinition $distinct = null,
        public ?string $measurementKind = null,
        public ?int $maximumGapSeconds = null,
        public ?string $resetPolicy = null,
        public ?float $rolloverAt = null,
        public ?string $canonicalUnit = null,
        public ?int $percentile = null,
        public ?string $numeratorMetric = null,
        public ?string $denominatorMetric = null,
        public ?string $seriesKey = null,
        public ?string $hierarchyRootKey = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $match = Fields::optionalObjects($payload, 'match');
        $numeric = Fields::optionalObject($payload, 'numeric');
        $distinct = Fields::optionalObject($payload, 'distinct');

        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'label'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'calculation'),
            Fields::optionalString($payload, 'unit'),
            Fields::optionalString($payload, 'description'),
            $match === null ? null : array_map(static fn (\stdClass $item): MatchPredicate => MatchPredicate::fromPayload($item), $match),
            Fields::optionalString($payload, 'flowResult'),
            $numeric === null ? null : NumericSelector::fromPayload($numeric),
            $distinct === null ? null : SelectorDefinition::fromPayload($distinct),
            Fields::optionalString($payload, 'measurementKind'),
            Fields::optionalInteger($payload, 'maximumGapSeconds'),
            Fields::optionalString($payload, 'resetPolicy'),
            Fields::optionalNumber($payload, 'rolloverAt'),
            Fields::optionalString($payload, 'canonicalUnit'),
            Fields::optionalInteger($payload, 'percentile'),
            Fields::optionalString($payload, 'numeratorMetric'),
            Fields::optionalString($payload, 'denominatorMetric'),
            Fields::optionalString($payload, 'seriesKey'),
            Fields::optionalString($payload, 'hierarchyRootKey'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'label' => $this->label,
            'kind' => $this->kind,
            'calculation' => $this->calculation,
        ];
        foreach (['unit' => $this->unit, 'description' => $this->description, 'flowResult' => $this->flowResult, 'measurementKind' => $this->measurementKind, 'resetPolicy' => $this->resetPolicy, 'canonicalUnit' => $this->canonicalUnit, 'numeratorMetric' => $this->numeratorMetric, 'denominatorMetric' => $this->denominatorMetric, 'seriesKey' => $this->seriesKey, 'hierarchyRootKey' => $this->hierarchyRootKey] as $key => $value) {
            if ($value !== null) {
                $payload[$key] = $value;
            }
        }
        foreach (['maximumGapSeconds' => $this->maximumGapSeconds, 'percentile' => $this->percentile] as $key => $value) {
            if ($value !== null) {
                $payload[$key] = $value;
            }
        }
        if ($this->rolloverAt !== null) {
            $payload['rolloverAt'] = $this->rolloverAt;
        }
        if ($this->match !== null) {
            $payload['match'] = array_map(static fn (MatchPredicate $item): array => $item->serialise(), $this->match);
        }
        if ($this->numeric !== null) {
            $payload['numeric'] = $this->numeric->serialise();
        }
        if ($this->distinct !== null) {
            $payload['distinct'] = $this->distinct->serialise();
        }

        return $payload;
    }
}
