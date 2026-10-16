<?php

declare(strict_types=1);

namespace HaakCo\Custd\Auth;

final readonly class ApplicationAuthorityRequest
{
    public function __construct(#[\SensitiveParameter] public string $accessToken)
    {
        if (trim($accessToken) === '') {
            throw new \InvalidArgumentException('custd: application access token is required');
        }
    }

    /** @return array{accessToken:string} */
    public function toPayload(): array
    {
        return ['accessToken' => $this->accessToken];
    }
}
