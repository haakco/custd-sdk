<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Measurement;

final readonly class ProjectRunCreateRequest
{
    public function __construct(
        public string $projectCode,
        public ?string $name = null,
        public ?string $targetDate = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'projectCode' => $this->projectCode,
        ];
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }
        if ($this->targetDate !== null) {
            $body['targetDate'] = $this->targetDate;
        }

        return $body;
    }
}
