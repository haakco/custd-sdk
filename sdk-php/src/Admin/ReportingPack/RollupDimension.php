<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** RollupDimension maps one rollup slot to a dimension and selector. */
final readonly class RollupDimension
{
    public function __construct(
        public int $slot,
        public string $dimension,
        public string $selector,
        public ?string $allowedValuePattern = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'slot'),
            Fields::string($payload, 'dimension'),
            Fields::string($payload, 'selector'),
            Fields::optionalString($payload, 'allowedValuePattern'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ['slot' => $this->slot, 'dimension' => $this->dimension, 'selector' => $this->selector];
        if ($this->allowedValuePattern !== null) {
            $payload['allowedValuePattern'] = $this->allowedValuePattern;
        }

        return $payload;
    }
}
