<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

final readonly class CreateVersionRequest
{
    /**
     * @param list<Quantity> $quantities
     */
    public function __construct(
        public array $quantities,
        public ?string $note = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'quantities' => array_map(static fn (Quantity $item): array => $item->serialise(), $this->quantities),
        ];
        if ($this->note !== null) {
            $body['note'] = $this->note;
        }

        return $body;
    }
}
