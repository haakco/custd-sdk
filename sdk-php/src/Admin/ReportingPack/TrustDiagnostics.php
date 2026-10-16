<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** TrustDiagnostics lists the safe output fields and the redaction guard. */
final readonly class TrustDiagnostics
{
    /**
     * @param list<string> $safeFields
     * @param list<string> $redactionGuard
     */
    public function __construct(
        public array $safeFields,
        public array $redactionGuard,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::strings($payload, 'safeFields'), Fields::strings($payload, 'redactionGuard'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['safeFields' => $this->safeFields, 'redactionGuard' => $this->redactionGuard];
    }
}
