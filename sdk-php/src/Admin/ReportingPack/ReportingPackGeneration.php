<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackGeneration is one published reporting-pack generation. */
final readonly class ReportingPackGeneration
{
    public function __construct(
        public int $id,
        public int $generationNumber,
        public int $sourceDraftId,
        public PackDefinition $definition,
        public string $state,
        public ?string $createdAt = null,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'reporting pack generation response');

        return new self(
            Fields::integer($object, 'id'),
            Fields::integer($object, 'generationNumber'),
            Fields::integer($object, 'sourceDraftId'),
            PackDefinition::fromPayload(Fields::object($object, 'definition')),
            Fields::string($object, 'state'),
            Fields::optionalString($object, 'createdAt'),
        );
    }
}
