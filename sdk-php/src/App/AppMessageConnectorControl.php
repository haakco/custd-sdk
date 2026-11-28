<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageConnectorControl
{
    public function __construct(
        public AppMessageConnectorAction $action,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'action' => $this->action->value,
        ];
    }
}
