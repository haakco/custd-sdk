<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\TimePlan;

interface Dto
{
    /** @return array<string, mixed> */
    public function toPayload(): array;
}
