<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** AllocationRule distributes one source series across allocation targets. */
final readonly class AllocationRule
{
    /** @param list<AllocationTarget> $targets */
    public function __construct(
        public string $key,
        public string $sourceSeriesKey,
        public array $targets,
        public RoundingPolicy $rounding,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'sourceSeriesKey'),
            array_map(static fn (\stdClass $item): AllocationTarget => AllocationTarget::fromPayload($item), Fields::objects($payload, 'targets')),
            RoundingPolicy::fromPayload(Fields::object($payload, 'rounding')),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'key' => $this->key,
            'sourceSeriesKey' => $this->sourceSeriesKey,
            'targets' => array_map(static fn (AllocationTarget $item): array => $item->serialise(), $this->targets),
            'rounding' => $this->rounding->serialise(),
        ];
    }
}
