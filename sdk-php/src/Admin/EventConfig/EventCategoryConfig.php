<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EventConfig;

use HaakCo\Custd\Fields;

final readonly class EventCategoryConfig
{
    public function __construct(
        public bool $isAudit,
        public string $name,
        public string $slug,
        public ?int $retentionDays = null,
        public mixed $rollupDimensions = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'isAudit'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'slug'),
            Fields::optionalInteger($payload, 'retentionDays'),
            Fields::raw($payload, 'rollupDimensions'),
        );
    }
}
