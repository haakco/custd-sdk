<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** SubjectScopeRule marks a required subject-scope dimension. */
final readonly class SubjectScopeRule
{
    public function __construct(
        public bool $required,
        public string $dimension,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(Fields::boolean($payload, 'required'), Fields::string($payload, 'dimension'));
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        return ['required' => $this->required, 'dimension' => $this->dimension];
    }
}
