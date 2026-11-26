<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class CalculateRequest
{
    /**
     * @param list<string> $outputs
     * @param list<InputOverride>|null $inputs
     */
    public function __construct(
        public array $outputs,
        public ?array $inputs = null,
        public ?int $sampleCount = null,
        public ?int $seed = null,
        public ?int $versionNumber = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $body = [
            'outputs' => $this->outputs,
        ];
        if ($this->inputs !== null) {
            $body['inputs'] = array_map(static fn (InputOverride $item): array => $item->serialise(), $this->inputs);
        }
        if ($this->sampleCount !== null) {
            $body['sampleCount'] = $this->sampleCount;
        }
        if ($this->seed !== null) {
            $body['seed'] = $this->seed;
        }
        if ($this->versionNumber !== null) {
            $body['versionNumber'] = $this->versionNumber;
        }

        return $body;
    }
}
