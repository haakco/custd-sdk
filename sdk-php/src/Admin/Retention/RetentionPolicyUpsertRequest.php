<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Retention;

final readonly class RetentionPolicyUpsertRequest
{
    public function __construct(
        public bool $legalHold,
        public int $maxAgeSeconds,
        public int $precedence,
        public string $retentionClass,
        public string $scope,
        public ?string $effectiveAt = null,
        public ?string $expiresAt = null,
        public ?string $legalHoldReference = null,
        public ?string $legalHoldUntil = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'legalHold' => $this->legalHold,
            'maxAgeSeconds' => $this->maxAgeSeconds,
            'precedence' => $this->precedence,
            'retentionClass' => $this->retentionClass,
            'scope' => $this->scope,
        ];
        if ($this->effectiveAt !== null) {
            $body['effectiveAt'] = $this->effectiveAt;
        }
        if ($this->expiresAt !== null) {
            $body['expiresAt'] = $this->expiresAt;
        }
        if ($this->legalHoldReference !== null) {
            $body['legalHoldReference'] = $this->legalHoldReference;
        }
        if ($this->legalHoldUntil !== null) {
            $body['legalHoldUntil'] = $this->legalHoldUntil;
        }

        return $body;
    }
}
