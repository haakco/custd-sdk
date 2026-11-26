<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Uncertainty\Quantity;

final readonly class AppModelVersionRequest
{
    /**
     * @param list<Quantity> $quantities
     * @param list<string>|null $counterLinks
     */
    public function __construct(
        public array $quantities,
        public ?array $counterLinks = null,
        public ?string $note = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'quantities' => array_map(static fn (Quantity $item): array => $item->serialise(), $this->quantities),
        ];
        if ($this->counterLinks !== null) {
            $body['counterLinks'] = $this->counterLinks;
        }
        if ($this->note !== null) {
            $body['note'] = $this->note;
        }

        return $body;
    }
}
