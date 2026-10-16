<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ReportingPack;

use HaakCo\Custd\Fields;

/** ReportingPackSetupTemplateListResponse is the named result of the setup-templates list. */
final readonly class ReportingPackSetupTemplateListResponse
{
    /** @param list<ReportingPackSetupTemplate> $templates */
    public function __construct(
        public array $templates,
    ) {
    }

    public static function fromPayload(mixed $payload): self
    {
        $object = Fields::jsonObject($payload, 'reporting pack setup template list response');

        return new self(array_map(
            static fn (\stdClass $item): ReportingPackSetupTemplate => ReportingPackSetupTemplate::fromPayload($item),
            Fields::objects($object, 'templates'),
        ));
    }
}
