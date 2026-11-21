<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

final readonly class SiteProbeSpec
{
    public const PING = 'ping';
    public const TCP = 'tcp';
    public const DNS = 'dns';
    public const HTTP_DELIVERY = 'http-delivery';

    /** @param list<string> $expectedAddresses */
    public function __construct(
        public string $kind,
        public ?int $port = null,
        public array $expectedAddresses = [],
        public ?string $protocol = null,
    ) {
    }

    /** @return array{kind: string, port?: int, expectedAddresses?: list<string>, protocol?: string} */
    public function toPayload(): array
    {
        $payload = ['kind' => $this->kind];
        if ($this->port !== null) {
            $payload['port'] = $this->port;
        }
        if ($this->expectedAddresses !== []) {
            $payload['expectedAddresses'] = $this->expectedAddresses;
        }
        if ($this->protocol !== null) {
            $payload['protocol'] = $this->protocol;
        }

        return $payload;
    }
}
