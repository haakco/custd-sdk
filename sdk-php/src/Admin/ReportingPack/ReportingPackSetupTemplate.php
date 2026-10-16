<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackSetupTemplate is one reviewed setup template. */
final readonly class ReportingPackSetupTemplate
{
    /** @param list<ReportingPackSetupBindingField> $bindings */
    public function __construct(
        public string $kind,
        public string $displayName,
        public PackDefinition $definition,
        public array $bindings,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'kind'),
            Fields::string($payload, 'displayName'),
            PackDefinition::fromPayload(Fields::object($payload, 'definition')),
            array_map(
                static fn (\stdClass $item): ReportingPackSetupBindingField => ReportingPackSetupBindingField::fromPayload($item),
                Fields::objects($payload, 'bindings'),
            ),
        );
    }
}
