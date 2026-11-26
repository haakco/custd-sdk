<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Accounting;

use HaakCo\Custd\Fields;

final readonly class AccountingEvidenceListResponse
{
    /**
     * @param list<AccountingEvidence> $evidence
     */
    public function __construct(
        public array $evidence,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AccountingEvidence::fromPayload(...), Fields::objects($payload, 'evidence')),
        );
    }
}
