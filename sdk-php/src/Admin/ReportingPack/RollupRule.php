<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RollupRule declares how one metric rolls up for one source event type. */
final readonly class RollupRule
{
    /**
     * @param list<string>|null $templates
     * @param list<MatchPredicate>|null $match
     * @param list<RollupDimension>|null $dimensions
     */
    public function __construct(
        public string $family,
        public string $metric,
        public string $sourceEventType,
        public bool $completenessRequired,
        public ?array $templates = null,
        public ?array $match = null,
        public ?array $dimensions = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $match = Fields::optionalObjects($payload, 'match');
        $dimensions = Fields::optionalObjects($payload, 'dimensions');

        return new self(
            Fields::string($payload, 'family'),
            Fields::string($payload, 'metric'),
            Fields::string($payload, 'sourceEventType'),
            Fields::boolean($payload, 'completenessRequired'),
            Fields::optionalStrings($payload, 'templates'),
            $match === null ? null : array_map(static fn (\stdClass $item): MatchPredicate => MatchPredicate::fromPayload($item), $match),
            $dimensions === null ? null : array_map(static fn (\stdClass $item): RollupDimension => RollupDimension::fromPayload($item), $dimensions),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'family' => $this->family,
            'metric' => $this->metric,
            'sourceEventType' => $this->sourceEventType,
            'completenessRequired' => $this->completenessRequired,
        ];
        if ($this->templates !== null) {
            $payload['templates'] = $this->templates;
        }
        if ($this->match !== null) {
            $payload['match'] = array_map(static fn (MatchPredicate $item): array => $item->serialise(), $this->match);
        }
        if ($this->dimensions !== null) {
            $payload['dimensions'] = array_map(static fn (RollupDimension $item): array => $item->serialise(), $this->dimensions);
        }

        return $payload;
    }
}
