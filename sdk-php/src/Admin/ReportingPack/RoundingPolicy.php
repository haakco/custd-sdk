<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RoundingPolicy is the closed rounding mode and its decimal-place count. */
final readonly class RoundingPolicy
{
    /** The closed rounding modes. */
    public const MODES = ['half_up', 'half_even', 'down', 'up'];

    public function __construct(
        public string $mode,
        public int $decimalPlaces,
    ) {
        if (!in_array($this->mode, self::MODES, true)) {
            throw new \InvalidArgumentException(
                'custd: rounding policy mode must be one of ' . implode(', ', self::MODES)
            );
        }
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'mode'),
            Fields::integer($payload, 'decimalPlaces'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'mode' => $this->mode,
            'decimalPlaces' => $this->decimalPlaces,
        ];
    }
}
