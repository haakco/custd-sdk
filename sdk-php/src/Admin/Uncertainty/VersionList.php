<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Uncertainty;

use HaakCo\Custd\Fields;

final readonly class VersionList
{
    /**
     * @param list<VersionSummary> $versions
     */
    public function __construct(
        public array $versions,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(VersionSummary::fromPayload(...), Fields::objects($payload, 'versions')),
        );
    }
}
