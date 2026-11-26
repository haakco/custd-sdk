<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMeetingBlockCreate
{
    public function __construct(
        public int $predictedMs,
        public string $title,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'predictedMs' => $this->predictedMs,
            'title' => $this->title,
        ];

        return $body;
    }
}
