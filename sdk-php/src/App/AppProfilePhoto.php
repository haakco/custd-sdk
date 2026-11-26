<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

/** AppProfilePhoto is a profile photo: a PNG or WebP image of at most 256 KiB. */
final readonly class AppProfilePhoto
{
    public const PNG = 'image/png';
    public const WEBP = 'image/webp';

    public function __construct(public string $contentType, public string $bytes)
    {
        if (!in_array($contentType, [self::PNG, self::WEBP], true) || $bytes === '' || strlen($bytes) > AppProfileClient::MAX_PHOTO_BYTES) {
            throw new \InvalidArgumentException('custd: app profile photo must be PNG or WebP and at most 256 KiB');
        }
    }

    /** fromBytes reads the image type from the bytes themselves, as the server stores them. */
    public static function fromBytes(string $bytes): self
    {
        $type = match (true) {
            str_starts_with($bytes, "\x89PNG\r\n\x1a\n") => self::PNG,
            str_starts_with($bytes, 'RIFF') && substr($bytes, 8, 4) === 'WEBP' => self::WEBP,
            default => '',
        };

        return new self($type, $bytes);
    }
}
