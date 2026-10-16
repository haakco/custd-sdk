<?php

declare(strict_types=1);

namespace HaakCo\Custd\RawIngest;

/**
 * RawRequestIdempotencyKey is a standard raw-upload idempotency key:
 * `<unix-milliseconds>:<uuid-v4>`. The same key and the same body/parser/target
 * let the backend return the accepted receipt again instead of landing a second
 * copy; a changed intent under the same key is refused with a conflict. It
 * carries no payload or credential.
 */
final readonly class RawRequestIdempotencyKey
{
    private const PATTERN = '/^(\d+):([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/';

    public function __construct(public string $value)
    {
        if (preg_match(self::PATTERN, $this->value, $matches) !== 1 || (int) $matches[1] <= 0) {
            throw new \InvalidArgumentException(
                'custd: raw idempotency key must be <unix-milliseconds>:<uuid-v4>'
            );
        }
    }

    /**
     * Mint a fresh key from the current time and a random UUIDv4. Mint it ONCE
     * per request object so a resend reuses the key; a genuinely repeated
     * occurrence needs a new request object and therefore a new key.
     */
    public static function generate(): self
    {
        return new self(((int) floor(microtime(true) * 1000)) . ':' . self::uuidV4());
    }

    private static function uuidV4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20),
        );
    }
}
