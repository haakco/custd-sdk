<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\EventConfig;

use HaakCo\Custd\Fields;

final readonly class EventTypeConfig
{
    public function __construct(
        public bool $categoryIsAudit,
        public string $categorySlug,
        public string $name,
        public string $slug,
        public ?int $categoryRetentionDays = null,
        public ?int $retentionDays = null,
        public mixed $rollupDimensions = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            Fields::boolean($payload, 'categoryIsAudit'),
            Fields::string($payload, 'categorySlug'),
            Fields::string($payload, 'name'),
            Fields::string($payload, 'slug'),
            Fields::optionalInteger($payload, 'categoryRetentionDays'),
            Fields::optionalInteger($payload, 'retentionDays'),
            Fields::raw($payload, 'rollupDimensions'),
        );
    }
}
