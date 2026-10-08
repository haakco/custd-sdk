<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\AuthProject;

final readonly class ApplicationPrincipalErasureRequest
{
    public function __construct(public bool $confirm)
    {
    }

    /** @return array{confirm: bool} */
    public function toPayload(): array
    {
        return ['confirm' => $this->confirm];
    }
}
