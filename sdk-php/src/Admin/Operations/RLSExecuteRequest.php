<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

final readonly class RLSExecuteRequest
{
    public function __construct(
        public ?bool $force = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->force !== null) {
            $body['force'] = $this->force;
        }

        return $body;
    }
}
