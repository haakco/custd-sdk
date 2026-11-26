<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class EventRollupDimension
{
    /**
     * @param list<string> $lookups
     */
    public function __construct(
        public array $lookups,
        public string $slot,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'lookups' => $this->lookups,
            'slot' => $this->slot,
        ];

        return $body;
    }
}
