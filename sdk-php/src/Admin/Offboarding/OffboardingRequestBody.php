<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

final readonly class OffboardingRequestBody
{
    public function __construct(
        public string $confirmation,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'confirmation' => $this->confirmation,
        ];

        return $body;
    }
}
