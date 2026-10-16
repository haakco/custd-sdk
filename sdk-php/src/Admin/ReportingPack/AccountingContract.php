<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** AccountingContract declares the usage metric, schedules and allocations. */
final readonly class AccountingContract
{
    /**
     * @param list<SteppedRateSchedule> $schedules
     * @param list<AllocationRule>|null $allocations
     */
    public function __construct(
        public int $version,
        public string $usageMetric,
        public array $schedules,
        public ?array $allocations = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $allocations = Fields::optionalObjects($payload, 'allocations');

        return new self(
            Fields::integer($payload, 'version'),
            Fields::string($payload, 'usageMetric'),
            array_map(static fn (\stdClass $item): SteppedRateSchedule => SteppedRateSchedule::fromPayload($item), Fields::objects($payload, 'schedules')),
            $allocations === null ? null : array_map(static fn (\stdClass $item): AllocationRule => AllocationRule::fromPayload($item), $allocations),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'version' => $this->version,
            'usageMetric' => $this->usageMetric,
            'schedules' => array_map(static fn (SteppedRateSchedule $item): array => $item->serialise(), $this->schedules),
        ];
        if ($this->allocations !== null) {
            $payload['allocations'] = array_map(static fn (AllocationRule $item): array => $item->serialise(), $this->allocations);
        }

        return $payload;
    }
}
