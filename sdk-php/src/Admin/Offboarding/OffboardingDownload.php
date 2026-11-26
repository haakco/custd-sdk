<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Offboarding;

/** OffboardingDownload is the verified export: its bytes, their SHA-256 checksum and their length. */
final readonly class OffboardingDownload
{
    public function __construct(
        public string $bytes,
        public string $checksumSha256,
        public int $byteSize,
    ) {
    }
}
