<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class ProjectUpdateRequest
{
    public function __construct(
        public ?string $definitionOfDone = null,
        public ?string $deliveryTargetDate = null,
        public ?string $description = null,
        public ?string $forecastMethod = null,
        public ?string $name = null,
        public ?bool $runSimilar = null,
        public ?string $status = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->definitionOfDone !== null) {
            $body['definitionOfDone'] = $this->definitionOfDone;
        }
        if ($this->deliveryTargetDate !== null) {
            $body['deliveryTargetDate'] = $this->deliveryTargetDate;
        }
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->forecastMethod !== null) {
            $body['forecastMethod'] = $this->forecastMethod;
        }
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }
        if ($this->runSimilar !== null) {
            $body['runSimilar'] = $this->runSimilar;
        }
        if ($this->status !== null) {
            $body['status'] = $this->status;
        }

        return $body;
    }
}
