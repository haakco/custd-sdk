<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

final readonly class AppMessageMutation
{
    public function __construct(
        public string $externalId,
        public string $operationId,
        public AppMessageMutationKind $kind,
        public int $revision,
        public ?string $text = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = [
            'externalId' => $this->externalId,
            'operationId' => $this->operationId,
            'kind' => $this->kind->value,
            'revision' => $this->revision,
        ];

        if ($this->text !== null) {
            $payload['text'] = $this->text;
        }

        return $payload;
    }
}
