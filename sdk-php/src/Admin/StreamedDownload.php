<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin;

/**
 * StreamedDownload describes a download the SDK wrote into the caller's stream as it arrived: the bytes
 * written and their SHA-256, the Content-Type, the server's X-Request-Id to quote when reporting a problem
 * (empty when none was sent), and every response header lower-cased.
 */
final readonly class StreamedDownload
{
    /** @param array<string, string> $headers */
    public function __construct(
        public int $byteSize,
        public string $checksumSha256,
        public string $contentType,
        public string $requestId,
        public array $headers,
    ) {
    }
}
