<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\SiteDomain;

use HaakCo\Custd\Fields;

/**
 * SiteStatusPageDraft is the title and components to preview or publish: a title of up to 100
 * characters and 1 to 20 distinct domains of the same Site, each with a label of up to 100.
 */
final readonly class SiteStatusPageDraft
{
    /** @param list<SiteStatusPageSelection> $components */
    public function __construct(
        public string $title,
        public array $components,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'title'),
            array_map(SiteStatusPageSelection::fromPayload(...), Fields::objects($payload, 'components')),
        );
    }

    /** @return array{title: string, components: list<array{domainUuid: string, label: string}>} */
    public function serialise(): array
    {
        return [
            'title' => $this->title,
            'components' => array_map(static fn (SiteStatusPageSelection $c): array => $c->serialise(), $this->components),
        ];
    }
}
