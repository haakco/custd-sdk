<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** NarrativeBlock is one executive-report narrative paragraph. */
final readonly class NarrativeBlock
{
    /** @param list<NarrativeValueReference>|null $references */
    public function __construct(
        public string $text,
        public ?array $references = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        $references = Fields::optionalObjects($payload, 'references');
        $blocks = $references === null
            ? null
            : array_map(static fn (\stdClass $item): NarrativeValueReference => NarrativeValueReference::fromPayload($item), $references);

        return new self(Fields::string($payload, 'text'), $blocks);
    }

    /** @return array<string, mixed> */
    public function serialise(): array
    {
        $payload = ['text' => $this->text];
        if ($this->references !== null) {
            $payload['references'] = array_map(static fn (NarrativeValueReference $item): array => $item->serialise(), $this->references);
        }

        return $payload;
    }
}
