<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;
use HaakCo\Custd\NextAction;

final readonly class NextActionHint
{
    /**
     * @param NextAction::* $action
     */
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
