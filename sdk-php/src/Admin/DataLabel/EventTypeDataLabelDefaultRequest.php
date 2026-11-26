<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\DataLabel;

final readonly class EventTypeDataLabelDefaultRequest
{
    public function __construct(
        public string $valueUuid,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'valueUuid' => $this->valueUuid,
        ];

        return $body;
    }
}
