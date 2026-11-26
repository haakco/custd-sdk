<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

use HaakCo\Custd\Fields;

final readonly class NextActionHint
{
    public function __construct(
        public string $action,
        public ?int $maxRetries = null,
        public ?int $pollAfterSeconds = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'action'),
            Fields::optionalInteger($payload, 'maxRetries'),
            Fields::optionalInteger($payload, 'pollAfterSeconds'),
        );
    }
}
