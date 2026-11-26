<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Fields;

final readonly class AppItemMeasurementPage
{
    /**
     * @param list<AppItemMeasurement> $rows
     */
    public function __construct(
        public array $rows,
        public string $runUuid,
        public ?string $nextCursor = null,
    ) {
    }

    public static function fromPayload(\stdClass $payload): self
    {
        return new self(
            array_map(AppItemMeasurement::fromPayload(...), Fields::objects($payload, 'rows')),
            Fields::string($payload, 'runUuid'),
            Fields::optionalString($payload, 'nextCursor'),
        );
    }
}
