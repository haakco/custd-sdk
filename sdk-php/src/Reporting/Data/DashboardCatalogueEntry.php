<?php

declare(strict_types=1);

namespace HaakCo\Custd\Reporting\Data;

use HaakCo\Custd\Fields;

final readonly class DashboardCatalogueEntry
{
    /**
     * @param list<string> $exportFormats
     * @param list<string> $interactions
     */
    public function __construct(
        public string $defaultRange,
        public string $description,
        public array $exportFormats,
        public string $group,
        public array $interactions,
        public string $key,
        public int $refreshSeconds,
        public string $title,
        public DashboardCatalogueTrust $trust,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::string($payload, 'defaultRange'),
            Fields::string($payload, 'description'),
            Fields::strings($payload, 'exportFormats'),
            Fields::string($payload, 'group'),
            Fields::strings($payload, 'interactions'),
            Fields::string($payload, 'key'),
            Fields::integer($payload, 'refreshSeconds'),
            Fields::string($payload, 'title'),
            DashboardCatalogueTrust::fromPayload(Fields::object($payload, 'trust')),
        );
    }
}
