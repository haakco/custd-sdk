<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

final readonly class AppCreateRequest
{
    public function __construct(
        public string $name,
        public ?bool $signIn = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'name' => $this->name,
        ];
        if ($this->signIn !== null) {
            $body['signIn'] = $this->signIn;
        }

        return $body;
    }
}
