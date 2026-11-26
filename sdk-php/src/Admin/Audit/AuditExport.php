<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Audit;

/**
 * AuditExport is the server-generated bounded CSV or JSON export, undecoded, with its lower-cased response
 * headers (content-type names the format).
 */
final readonly class AuditExport
{
    /** @param array<string, string> $headers */
    public function __construct(
        public string $body,
        public array $headers,
    ) {
    }
}
