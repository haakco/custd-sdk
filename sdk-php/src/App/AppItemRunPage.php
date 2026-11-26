<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemRunPage
{
    /**
     * @param list<AppItemRun> $runs
     */
    public function __construct(
        public array $runs,
        public ?string $nextCursor = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppItemRun::fromPayload(...), Fields::objects($payload, 'runs')),
            Fields::optionalString($payload, 'nextCursor'),
        );
    }
}
