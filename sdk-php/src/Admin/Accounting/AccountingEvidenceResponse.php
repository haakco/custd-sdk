<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Accounting;

use HaakCo\Custd\Fields;

final readonly class AccountingEvidenceResponse
{
    public function __construct(
        public AccountingEvidence $evidence,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            AccountingEvidence::fromPayload(Fields::object($payload, 'evidence')),
        );
    }
}
