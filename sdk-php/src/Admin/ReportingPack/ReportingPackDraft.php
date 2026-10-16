<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackDraft is one platform-global reporting-pack draft. */
final readonly class ReportingPackDraft
{
    public function __construct(
        public int $id,
        public int $revision,
        public PackDefinition $definition,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::integer($payload, 'id'),
            Fields::integer($payload, 'revision'),
            PackDefinition::fromPayload(Fields::object($payload, 'definition')),
            Fields::optionalString($payload, 'createdAt'),
            Fields::optionalString($payload, 'updatedAt'),
        );
    }
}
