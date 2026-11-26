<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class MeasurementDecisionModelUpdateRequest
{
    public function __construct(
        public ?string $description = null,
        public ?string $name = null,
        public ?string $objective = null,
        public ?string $status = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }
        if ($this->objective !== null) {
            $body['objective'] = $this->objective;
        }
        if ($this->status !== null) {
            $body['status'] = $this->status;
        }

        return $body;
    }
}
