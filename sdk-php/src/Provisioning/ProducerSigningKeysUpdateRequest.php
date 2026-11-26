<?php

declare(strict_types=1);

namespace HaakCo\Custd\Provisioning;

/**
 * ProducerSigningKeysUpdateRequest replaces the Ed25519 public keys a signing producer's events are
 * verified with: one or two base64 keys, two while a key is being rotated.
 */
final readonly class ProducerSigningKeysUpdateRequest
{
    /** @param list<string> $publicKeys */
    public function __construct(
        public array $publicKeys,
    ) {
    }

    /** @return array{publicKeys: list<string>} */
    public function serialise(): array
    {
        return ['publicKeys' => $this->publicKeys];
    }
}
