<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

final readonly class RunRequest
{
    public function __construct(
        public int $seed,
        public ?Decision $decision = null,
        public ?int $sampleCount = null,
        public ?string $sensitivityOutput = null,
        public ?int $versionNumber = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'seed' => $this->seed,
        ];
        if ($this->decision !== null) {
            $body['decision'] = $this->decision->serialise();
        }
        if ($this->sampleCount !== null) {
            $body['sampleCount'] = $this->sampleCount;
        }
        if ($this->sensitivityOutput !== null) {
            $body['sensitivityOutput'] = $this->sensitivityOutput;
        }
        if ($this->versionNumber !== null) {
            $body['versionNumber'] = $this->versionNumber;
        }

        return $body;
    }
}
