<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Privacy;

final readonly class PrivacyIdentifierMapRequest
{
    public function __construct(
        public string $externalId,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'externalId' => $this->externalId,
        ];

        return $body;
    }
}
