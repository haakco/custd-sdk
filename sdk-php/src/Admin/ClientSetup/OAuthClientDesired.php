<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class OAuthClientDesired
{
    public function __construct(
        public string $clientId,
        public string $purposeProfile,
        public ?string $environment = null,
        public ?string $name = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'clientId' => $this->clientId,
            'purposeProfile' => $this->purposeProfile,
        ];
        if ($this->environment !== null) {
            $body['environment'] = $this->environment;
        }
        if ($this->name !== null) {
            $body['name'] = $this->name;
        }

        return $body;
    }
}
