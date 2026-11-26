<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

final readonly class CreateModelRequest
{
    /**
     * @param list<Quantity>|null $quantities
     */
    public function __construct(
        public string $name,
        public ?string $description = null,
        public ?string $note = null,
        public ?array $quantities = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'name' => $this->name,
        ];
        if ($this->description !== null) {
            $body['description'] = $this->description;
        }
        if ($this->note !== null) {
            $body['note'] = $this->note;
        }
        if ($this->quantities !== null) {
            $body['quantities'] = array_map(static fn (Quantity $item): array => $item->serialise(), $this->quantities);
        }

        return $body;
    }
}
