<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementTargetCreateRequest
{
    public function __construct(
        public string $name,
        public string $state,
        public string $targetCode,
        public float $targetValue,
        public ?string $targetDate = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'name' => $this->name,
            'state' => $this->state,
            'targetCode' => $this->targetCode,
            'targetValue' => $this->targetValue,
        ];
        if ($this->targetDate !== null) {
            $body['targetDate'] = $this->targetDate;
        }

        return $body;
    }
}
