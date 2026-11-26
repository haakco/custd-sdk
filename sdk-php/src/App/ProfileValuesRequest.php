<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class ProfileValuesRequest
{
    /**
     * @param list<ProfileValue> $values
     */
    public function __construct(
        public array $values,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'values' => array_map(static fn (ProfileValue $item): array => $item->serialise(), $this->values),
        ];

        return $body;
    }
}
