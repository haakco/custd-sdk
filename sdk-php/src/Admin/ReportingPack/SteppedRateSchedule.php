<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** SteppedRateSchedule is one stepped usage-pricing schedule. */
final readonly class SteppedRateSchedule
{
    /** @param list<RateTier> $tiers */
    public function __construct(
        public string $key,
        public string $usageMetric,
        public string $usageUnit,
        public string $timezone,
        public string $billingBoundary,
        public string $effectiveFrom,
        public string $currency,
        public array $tiers,
        public RoundingPolicy $rounding,
        public ?string $effectiveTo = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'usageMetric'),
            Fields::string($payload, 'usageUnit'),
            Fields::string($payload, 'timezone'),
            Fields::string($payload, 'billingBoundary'),
            Fields::string($payload, 'effectiveFrom'),
            Fields::string($payload, 'currency'),
            array_map(static fn (\stdClass $item): RateTier => RateTier::fromPayload($item), Fields::objects($payload, 'tiers')),
            RoundingPolicy::fromPayload(Fields::object($payload, 'rounding')),
            Fields::optionalString($payload, 'effectiveTo'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'key' => $this->key,
            'usageMetric' => $this->usageMetric,
            'usageUnit' => $this->usageUnit,
            'timezone' => $this->timezone,
            'billingBoundary' => $this->billingBoundary,
            'effectiveFrom' => $this->effectiveFrom,
            'currency' => $this->currency,
            'tiers' => array_map(static fn (RateTier $item): array => $item->serialise(), $this->tiers),
            'rounding' => $this->rounding->serialise(),
        ];
        if ($this->effectiveTo !== null) {
            $payload['effectiveTo'] = $this->effectiveTo;
        }

        return $payload;
    }
}
