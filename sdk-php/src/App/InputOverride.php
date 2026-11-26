<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\Uncertainty\Input;

final readonly class InputOverride
{
    public function __construct(
        public Input $input,
        public string $name,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'input' => $this->input->serialise(),
            'name' => $this->name,
        ];

        return $body;
    }
}
