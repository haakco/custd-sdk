<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\App;

use HaakCo\Custd\Fields;

final readonly class AppListResponse
{
    /**
     * @param list<AppSummary> $apps
     */
    public function __construct(
        public array $apps,
        public ?string $nextAfter = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppSummary::fromPayload(...), Fields::objects($payload, 'apps')),
            Fields::optionalString($payload, 'nextAfter'),
        );
    }
}
