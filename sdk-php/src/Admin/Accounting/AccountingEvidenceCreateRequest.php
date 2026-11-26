<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Accounting;

final readonly class AccountingEvidenceCreateRequest
{
    public function __construct(
        public string $auditCorrelationId,
        public string $effectiveAt,
        public string $id,
        public string $kind,
        public string $observedAt,
        public string $reason,
        public string $unit,
        public ?float $balance = null,
        public ?float $delta = null,
        public ?float $quantity = null,
        public ?string $supersedesId = null,
        public ?string $targetId = null,
        public ?string $targetKind = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'auditCorrelationId' => $this->auditCorrelationId,
            'effectiveAt' => $this->effectiveAt,
            'id' => $this->id,
            'kind' => $this->kind,
            'observedAt' => $this->observedAt,
            'reason' => $this->reason,
            'unit' => $this->unit,
        ];
        if ($this->balance !== null) {
            $body['balance'] = $this->balance;
        }
        if ($this->delta !== null) {
            $body['delta'] = $this->delta;
        }
        if ($this->quantity !== null) {
            $body['quantity'] = $this->quantity;
        }
        if ($this->supersedesId !== null) {
            $body['supersedesId'] = $this->supersedesId;
        }
        if ($this->targetId !== null) {
            $body['targetId'] = $this->targetId;
        }
        if ($this->targetKind !== null) {
            $body['targetKind'] = $this->targetKind;
        }

        return $body;
    }
}
