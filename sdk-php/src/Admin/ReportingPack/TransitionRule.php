<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** TransitionRule bounds an identity step transition. */
final readonly class TransitionRule
{
    /** @param list<string> $steps */
    public function __construct(
        public string $key,
        public string $identity,
        public string $stepSelector,
        public array $steps,
        public int $maxDurationMs,
        public int $maxEvents,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'key'),
            Fields::string($payload, 'identity'),
            Fields::string($payload, 'stepSelector'),
            Fields::strings($payload, 'steps'),
            Fields::integer($payload, 'maxDurationMs'),
            Fields::integer($payload, 'maxEvents'),
        );
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return [
            'key' => $this->key,
            'identity' => $this->identity,
            'stepSelector' => $this->stepSelector,
            'steps' => $this->steps,
            'maxDurationMs' => $this->maxDurationMs,
            'maxEvents' => $this->maxEvents,
        ];
    }
}
