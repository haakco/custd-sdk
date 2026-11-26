<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Accounting;

use HaakCo\Custd\Fields;
use HaakCo\Custd\Admin\ReportingPack\CanonicalUnit;

final readonly class AccountingEvidence
{
    /**
     * @param CanonicalUnit::* $unit
     * @param AccountingEvidenceKind::* $kind
     * @param AccountingEvidenceKind::*|null $targetKind
     */
    public function __construct(
        public string $actor,
        public string $auditCorrelationId,
        public string $effectiveAt,
        public string $id,
        public string $kind,
        public string $observedAt,
        public string $reason,
        public string $tenantKey,
        public string $unit,
        public ?float $balance = null,
        public ?float $delta = null,
        public ?float $quantity = null,
        public ?string $supersedesId = null,
        public ?string $targetId = null,
        public ?string $targetKind = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'actor'),
            Fields::string($payload, 'auditCorrelationId'),
            Fields::string($payload, 'effectiveAt'),
            Fields::string($payload, 'id'),
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'observedAt'),
            Fields::string($payload, 'reason'),
            Fields::string($payload, 'tenantKey'),
            Fields::string($payload, 'unit'),
            Fields::optionalNumber($payload, 'balance'),
            Fields::optionalNumber($payload, 'delta'),
            Fields::optionalNumber($payload, 'quantity'),
            Fields::optionalString($payload, 'supersedesId'),
            Fields::optionalString($payload, 'targetId'),
            Fields::optionalString($payload, 'targetKind'),
        );
    }
}
