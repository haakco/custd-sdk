<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackSetupTemplateBindResponse is the configured definition the client then posts through CRUD. */
final readonly class ReportingPackSetupTemplateBindResponse
{
    public function __construct(
        public string $kind,
        public PackDefinition $definition,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'reporting pack setup template bind response');

        return new self(
            Fields::string($object, 'kind'),
            PackDefinition::fromPayload(Fields::object($object, 'definition')),
        );
    }
}
