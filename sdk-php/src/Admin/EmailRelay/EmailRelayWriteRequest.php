<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EmailRelay;

final readonly class EmailRelayWriteRequest
{
    public function __construct(
        public bool $enabled,
        public string $fromAddress,
        public string $fromDisplayName,
        public string $host,
        public string $password,
        public int $port,
        public string $tlsMode,
        public string $username,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'enabled' => $this->enabled,
            'fromAddress' => $this->fromAddress,
            'fromDisplayName' => $this->fromDisplayName,
            'host' => $this->host,
            'password' => $this->password,
            'port' => $this->port,
            'tlsMode' => $this->tlsMode,
            'username' => $this->username,
        ];

        return $body;
    }
}
