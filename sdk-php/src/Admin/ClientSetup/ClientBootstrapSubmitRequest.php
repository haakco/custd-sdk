<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class ClientBootstrapSubmitRequest
{
    /**
     * @param list<ClientBootstrapProof>|null $proofs
     */
    public function __construct(
        public ?string $contactEmail = null,
        public ?string $note = null,
        public ?array $proofs = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [];
        if ($this->contactEmail !== null) {
            $body['contactEmail'] = $this->contactEmail;
        }
        if ($this->note !== null) {
            $body['note'] = $this->note;
        }
        if ($this->proofs !== null) {
            $body['proofs'] = array_map(static fn (ClientBootstrapProof $item): array => $item->serialise(), $this->proofs);
        }

        return $body;
    }
}
