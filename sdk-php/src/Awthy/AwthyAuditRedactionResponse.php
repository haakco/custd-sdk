<?php

declare(strict_types=1);

namespace HaakCo\Custd\Awthy;

use HaakCo\Custd\Fields;

/**
 * AwthyAuditRedactionResponse reports a managed audit redaction: the redaction ID, the result shape the source
 * system's rule names, and one result per selected event.
 */
final readonly class AwthyAuditRedactionResponse
{
    /** @param list<AwthyAuditRedactionResult> $results */
    public function __construct(
        public bool $success,
        public string $redactionId,
        public string $resultShape,
        public array $results,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'success'),
            Fields::string($payload, 'redactionId'),
            Fields::string($payload, 'resultShape'),
            array_map(AwthyAuditRedactionResult::fromPayload(...), Fields::optionalObjects($payload, 'results') ?? []),
        );
    }
}
