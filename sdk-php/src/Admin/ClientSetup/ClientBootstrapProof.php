<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class ClientBootstrapProof
{
    /**
     * @param ClientBootstrapProofKind::* $kind
     */
    public function __construct(
        public string $kind,
        public string $observedAt,
        public string $value,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'kind' => $this->kind,
            'observedAt' => $this->observedAt,
            'value' => $this->value,
        ];

        return $body;
    }
}
