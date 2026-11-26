<?php

declare(strict_types=1);

namespace HaakCo\Custd\Awthy;

use HaakCo\Custd\Fields;

/** AwthyAuditRedactionResult is the outcome for one selected event: the selectors it matched and its status. */
final readonly class AwthyAuditRedactionResult
{
    /** @param array<string, string> $selectors */
    public function __construct(
        public array $selectors,
        public string $status,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::stringMap($payload, 'selectors'), Fields::string($payload, 'status'));
    }
}
