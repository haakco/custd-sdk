<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

final readonly class RetentionDesired
{
    /**
     * @param list<string> $classes
     */
    public function __construct(
        public array $classes,
        public int $maxAgeDays,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'classes' => $this->classes,
            'maxAgeDays' => $this->maxAgeDays,
        ];

        return $body;
    }
}
