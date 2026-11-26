<?php

declare(strict_types=1);

namespace HaakCo\Custd\Schemas;

/** EventSchemaInferRequest is the sample events a candidate schema is inferred from. */
final readonly class EventSchemaInferRequest
{
    /** @param list<array<string, mixed>> $samples Sample events, each a JSON object. */
    public function __construct(public array $samples)
    {
    }

    /** @return array{samples: list<array<string, mixed>>} */
    public function serialise(): array
    {
        return ['samples' => $this->samples];
    }
}
