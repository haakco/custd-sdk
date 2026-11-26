<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class ProjectEstimateCreateRequest
{
    public function __construct(
        public string $highDate,
        public string $lowDate,
        public ?string $estimatedAt = null,
        public ?string $note = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'highDate' => $this->highDate,
            'lowDate' => $this->lowDate,
        ];
        if ($this->estimatedAt !== null) {
            $body['estimatedAt'] = $this->estimatedAt;
        }
        if ($this->note !== null) {
            $body['note'] = $this->note;
        }

        return $body;
    }
}
